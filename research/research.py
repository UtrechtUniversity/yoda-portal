#!/usr/bin/env python3
from __future__ import annotations

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import io
import os
import queue
import threading
import urllib.parse
from typing import Iterator, Optional

from flask import (
    abort, Blueprint, current_app as app, g, jsonify, make_response,
    render_template, request, Response, session, stream_with_context
)
from irods.data_object import iRODSDataObject
from irods.exception import CAT_NO_ACCESS_PERMISSION, CAT_NO_ROWS_FOUND
from irods.manager.data_object_manager import DataObjectManager
from irods.message import iRODSMessage

import api
import connman
from util import log_error, unicode_secure_filename

research_bp = Blueprint('research_bp', __name__,
                        template_folder='templates',
                        static_folder='static/research',
                        static_url_path='/assets')


class Chunk:
    def __init__(self,
                 data_objects: Optional[DataObjectManager],
                 path: Optional[str],
                 number: int,
                 size: int,
                 data: Optional[str],
                 resource: Optional[str]) -> None:
        self.data_objects: Optional[DataObjectManager] = data_objects
        self.path: Optional[str] = path
        self.number: int = number
        self.size: int = size
        self.data: Optional[str] = data
        self.resource: Optional[str] = resource


q: queue.Queue[Chunk] = queue.Queue(4)
r: queue.Queue[bool] = queue.Queue(1)


def irods_writer() -> None:
    failure = False
    while True:
        chunk = q.get()
        if chunk.path and chunk.data_objects is not None:
            if not failure:
                try:
                    with chunk.data_objects.open(chunk.path, 'a', chunk.resource) as obj_desc:
                        obj_desc.seek(int(chunk.size * (chunk.number - 1)))
                        obj_desc.write(chunk.data)
                except Exception:
                    failure = True
                    log_error(f"Chunk upload failed for {chunk.path}")
                finally:
                    try:
                        obj_desc.close()
                    except Exception:
                        pass
            else:
                # Report back about failures.
                r.put(failure)
                failure = False
        q.task_done()


threading.Thread(target=irods_writer, name='irods-writer', daemon=True).start()


@research_bp.route('/')
@research_bp.route('/browse')
def index() -> Response:
    dir = request.args.get('dir')

    if dir is None:
        dir = ''

    return render_template('research/browse.html',
                           activeModule='research',
                           dir=dir)


@research_bp.route('/browse/download')
def download() -> Response:
    path = '/' + g.irods.zone + '/home' + request.args.get('filepath')
    filename = path.rsplit('/', 1)[1]
    quoted_filename = urllib.parse.quote(filename)

    def read_file_chunks(data_object: iRODSDataObject) -> Iterator[bytes]:
        READ_BUFFER_SIZE = 1024 * io.DEFAULT_BUFFER_SIZE

        try:
            with data_object.open('r') as fd:
                while True:
                    buf = fd.read(READ_BUFFER_SIZE)
                    if buf:
                        connman.extend(session.sid)
                        yield buf
                    else:
                        break
        except CAT_NO_ACCESS_PERMISSION:
            abort(403)
        except Exception:
            abort(500)

    if g.irods.data_objects.exists(path):
        data_object = g.irods.data_objects.get(path)
        size = data_object.replicas[0].size

        return Response(
            stream_with_context(read_file_chunks(data_object)),
            headers={
                'Content-Disposition': "attachment; filename*=UTF-8''" + quoted_filename,
                'Content-Length': f'{size}',
                'Content-Type': 'application/octet-stream'
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
        if not g.irods.collections.exists(base_dir):
            g.irods.collections.create(base_dir)
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
    flow_filename = unicode_secure_filename(flow_filename)

    filepath = request.args.get('filepath', type=str)

    if (not flow_identifier or not flow_filename or not flow_chunk_number
       or not flow_total_chunks or not flow_chunk_size or not filepath):
        # Parameters are missing or invalid.
        response = make_response(jsonify({"message": "Parameter missing or invalid"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    object_path = build_object_path(filepath, flow_relative_path, flow_filename)

    # Partial file name for chunked uploads.
    if flow_total_chunks > 1 and app.config.get('UPLOAD_PART_FILES'):
        object_path = f"{object_path}.part"

    if flow_total_chunks == 1:
        # Ensuring single chunk files get to the overwrite stage as well
        response = make_response(jsonify({"message": "Chunk not found"}), 204)
        response.headers["Content-Type"] = "application/json"
        return response

    try:
        obj = g.irods.data_objects.get(object_path)

        if obj.replicas[0].size > int(flow_chunk_size * (flow_chunk_number - 1)):
            # Chunk already exists.
            response = make_response(jsonify({"message": "Chunk found"}), 200)
            response.headers["Content-Type"] = "application/json"
            return response
        else:
            raise Exception
    except Exception:
        # Chunk does not exist and needs to be uploaded.
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
    flow_filename = unicode_secure_filename(flow_filename)

    filepath = request.form.get('filepath', type=str)

    if (not flow_identifier or not flow_filename or not flow_chunk_number
       or not flow_total_chunks or not flow_chunk_size or not filepath):
        # Parameters are missing or invalid.
        response = make_response(jsonify({"message": "Parameter missing or invalid"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    object_path = build_object_path(filepath, flow_relative_path, flow_filename)

    # Partial file name for chunked uploads.
    if flow_total_chunks > 1 and app.config.get('UPLOAD_PART_FILES'):
        object_path = f"{object_path}.part"

    # Get the chunk data.
    chunk_data = request.files['file']
    encode_unicode_content = iRODSMessage.encode_unicode(chunk_data.stream.read())

    # Truncate the existing data object, if present. This ensures that overwriting an
    # existing data object with a smaller file works as expected.
    if flow_chunk_number == 1:
        try:
            g.irods.data_objects.truncate(object_path, 0)
        except CAT_NO_ROWS_FOUND:
            # No file was present, which is okay.
            pass
        except Exception as e:
            log_error(f"Error occurred when truncating existing object on upload at {object_path} ({str(type(e))}:{str(e)})")
            response = make_response(jsonify({"message": "Upload failed when truncating existing data object."}), 500)
            response.headers["Content-Type"] = "application/json"
            return response

    # Write chunk data.
    q.put(Chunk(
        g.irods.data_objects,
        object_path,
        flow_chunk_number,
        flow_chunk_size,
        encode_unicode_content,
        app.config.get('IRODS_DEFAULT_RESC')
    ))

    # check at the end, and after every Gb
    if flow_total_chunks == flow_chunk_number:
        need_to_check_flow = True
    else:
        flow_check_byte_interval = 2**30  # Check upload flow (at least) every 1 GB
        flow_check_chunk_interval = int(flow_check_byte_interval / min(flow_chunk_size, flow_check_byte_interval))
        need_to_check_flow = flow_chunk_number % flow_check_chunk_interval == 0

    if need_to_check_flow:
        q.put(Chunk(None, None, 0, 0, None, None))
        q.join()

    if not r.empty():
        # Failure in upload writer thread.
        r.get()
        response = make_response(jsonify({"message": "Chunk upload failed"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    # Rename partial file name when complete for chunked uploads.
    if app.config.get('UPLOAD_PART_FILES') and flow_total_chunks > 1 and flow_total_chunks == flow_chunk_number:
        final_object_path = build_object_path(filepath, flow_relative_path, flow_filename)
        try:
            # overwriting doesn't work using the move command, therefore unlink the previous file first
            g.irods.data_objects.unlink(final_object_path, force=True)
        except CAT_NO_ROWS_FOUND:
            # No file was present, which is okay.
            pass
        except Exception as e:
            log_error(
                f"Error occurred on upload when unlinking existing object at {final_object_path} ({str(type(e))}:{str(e)})"
            )
            response = make_response(jsonify({"message": "Upload failed when removing existing data object."}), 500)
            response.headers["Content-Type"] = "application/json"
            return response

        g.irods.data_objects.move(object_path, final_object_path)

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@research_bp.route('/metadata/form')
def form() -> Response:
    path = request.args.get('path')
    return render_template('research/metadata-form.html', path=path)


@research_bp.route('/browse/download_checksum_report')
def download_report() -> Response:
    output = ""
    path = request.args.get("path")
    format = request.args.get("format")
    coll = "/" + g.irods.zone + "/home" + path
    response = api.call('research_manifest', data={'coll': coll})

    if format == 'csv':
        mime = 'text/csv'
        ext = '.csv'
        if response['status'] == 'ok':
            for result in response["data"]:
                output += f"{result['name']},{result['size']},{result['checksum']} \n"
    else:
        mime = 'text/plain'
        ext = '.txt'
        if response['status'] == 'ok':
            for result in response["data"]:
                output += f"{result['name']} {result['size']} {result['checksum']} \n"

    return Response(
        output,
        mimetype=mime,
        headers={'Content-disposition': 'attachment; filename=checksums' + ext}
    )
