#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import io
import os
from typing import Iterator

from flask import abort, Blueprint, g, jsonify, make_response, render_template, request, Response, stream_with_context
from irods.exception import CAT_NO_ACCESS_PERMISSION
from irods.message import iRODSMessage
from werkzeug.utils import secure_filename

import api

research_bp = Blueprint('research_bp', __name__,
                        template_folder='templates',
                        static_folder='static/research',
                        static_url_path='/assets')


@research_bp.route('/')
@research_bp.route('/browse')
def index() -> Response:
    items = 10
    dir = request.args.get('dir')

    if dir is None:
        dir = ''

    return render_template('research/browse.html',
                           activeModule='research',
                           items=items,
                           dir=dir)


@research_bp.route('/browse/download')
def download() -> Response:
    path = '/' + g.irods.zone + '/home' + request.args.get('filepath')
    filename = path.rsplit('/', 1)[1]
    session = g.irods

    READ_BUFFER_SIZE = 1024 * io.DEFAULT_BUFFER_SIZE

    def read_file_chunks(path: str) -> Iterator[bytes]:
        obj = session.data_objects.get(path)
        try:
            with obj.open('r') as fd:
                while True:
                    buf = fd.read(READ_BUFFER_SIZE)
                    if buf:
                        yield buf
                    else:
                        break
        except CAT_NO_ACCESS_PERMISSION:
            abort(403)
        except Exception:
            abort(500)

    if session.data_objects.exists(path):
        return Response(
            stream_with_context(read_file_chunks(path)),
            headers={
                'Content-Disposition': f'attachment; filename={filename}',
                'Content-Type': 'application/octet'
            }
        )
    else:
        abort(404)


def build_object_path(path: str, relative_path: str, filename: str) -> str:
    relative_path = os.path.dirname(relative_path)
    path = path.lstrip("/")

    # Build relative path.
    if relative_path:
        base_dir = os.path.join("/" + g.irods.zone, 'home', path, relative_path)
        # Ensure upload collection exists.
        session = g.irods
        if not session.collections.exists(base_dir):
            session.collections.create(base_dir)
    else:
        base_dir = os.path.join("/" + g.irods.zone, 'home', path)

    return os.path.join(base_dir, filename)


@research_bp.route('/upload', methods=['GET'])
def upload_get() -> Response:
    flow_identifier = request.args.get('flowIdentifier', type=str)
    flow_chunk_number = request.args.get('flowChunkNumber', type=int)
    flow_total_chunks = request.args.get('flowTotalChunks', type=int)
    flow_chunk_size = request.args.get('flowChunkSize', type=int)
    flow_relative_path = request.args.get('flowRelativePath', type=str)

    flow_filename = request.args.get('flowFilename', type=str)
    secured_filename = secure_filename(flow_filename)
    if flow_filename.startswith('._'):
        flow_filename = f'._{secured_filename}'
    elif flow_filename.startswith('.'):
        flow_filename = f'.{secured_filename}'
    else:
        flow_filename = secured_filename

    filepath = request.args.get('filepath', type=str)

    if (not flow_identifier or not flow_filename or not flow_chunk_number
       or not flow_total_chunks or not flow_chunk_size or not filepath):
        # Parameters are missing or invalid.
        response = make_response(jsonify({"message": "Parameter missing or invalid"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    session = g.irods
    object_path = build_object_path(filepath, flow_relative_path, flow_filename)

    # Partial file name for chunked uploads.
    if flow_total_chunks > 1:
        object_path = f"{object_path}.part"
    else:
        # Ensuring single chunk files get to the overwrite stage as well
        response = make_response(jsonify({"message": "Chunk not found"}), 204)
        response.headers["Content-Type"] = "application/json"
        return response

    try:
        obj = session.data_objects.get(object_path)

        if obj.replicas[0].size > int(flow_chunk_size * (flow_chunk_number - 1)):
            # Chunk already exists.
            response = make_response(jsonify({"message": "Chunk found"}), 200)
            response.headers["Content-Type"] = "application/json"
            return response
        else:
            raise Exception
    except Exception:
        # Chunk does not exists and needs to be uploaded.
        response = make_response(jsonify({"message": "Chunk not found"}), 204)
        response.headers["Content-Type"] = "application/json"
        return response


@research_bp.route('/upload', methods=['POST'])
def upload_post() -> Response:
    flow_identifier = request.form.get('flowIdentifier', type=str)
    flow_chunk_number = request.form.get('flowChunkNumber', type=int)
    flow_total_chunks = request.form.get('flowTotalChunks', type=int)
    flow_chunk_size = request.form.get('flowChunkSize', type=int)
    flow_relative_path = request.form.get('flowRelativePath', type=str)

    flow_filename = request.form.get('flowFilename', type=str)
    secured_filename = secure_filename(flow_filename)
    if flow_filename.startswith('._'):
        flow_filename = f'._{secured_filename}'
    elif flow_filename.startswith('.'):
        flow_filename = f'.{secured_filename}'
    else:
        flow_filename = secured_filename

    filepath = request.form.get('filepath', type=str)

    if (not flow_identifier or not flow_filename or not flow_chunk_number
       or not flow_total_chunks or not flow_chunk_size or not filepath):
        # Parameters are missing or invalid.
        response = make_response(jsonify({"message": "Parameter missing or invalid"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    session = g.irods
    object_path = build_object_path(filepath, flow_relative_path, flow_filename)

    # Partial file name for chunked uploads.
    if flow_total_chunks > 1:
        object_path = f"{object_path}.part"

    # Get the chunk data.
    chunk_data = request.files['file']
    encode_unicode_content = iRODSMessage.encode_unicode(chunk_data.stream.read())

    try:
        if flow_chunk_number == 1:
            with session.data_objects.open(object_path, 'w') as obj_desc:
                obj_desc.write(encode_unicode_content)

            obj_desc.close()
        else:
            with session.data_objects.open(object_path, 'a') as obj_desc:
                obj_desc.seek(int(flow_chunk_size * (flow_chunk_number - 1)))
                obj_desc.write(encode_unicode_content)

            obj_desc.close()
    except Exception:
        response = make_response(jsonify({"message": "Chunk upload failed"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    # Rename partial file name when complete for chunked uploads.
    if flow_total_chunks > 1 and flow_total_chunks == flow_chunk_number:
        final_object_path = build_object_path(filepath, flow_relative_path, flow_filename)
        try:
            # overwriting doesn't work using the move command, therefore unlink the previous file first
            session.data_objects.unlink(final_object_path, force=True)
        except Exception:
            # Probably there was no file present which is no erroneous situation
            pass
        session.data_objects.move(object_path, final_object_path)

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@research_bp.route('/metadata/form')
def form() -> Response:
    path = request.args.get('path')

    return render_template('research/metadata-form.html', path=path)


@research_bp.route('/browse/download_checksum_report')
def download_report() -> Response:
    path = request.args.get("path")
    coll = "/" + g.irods.zone + "/home" + path
    response = api.call('research_manifest', data={'coll': coll})

    output = ""
    for result in response["data"]:
        output += f"{result['name']} {result['checksum']} \n"

    return Response(
        output,
        mimetype='text/plain',
        headers={'Content-disposition': 'attachment; filename=checksums.txt'}
    )
