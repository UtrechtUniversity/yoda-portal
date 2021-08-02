#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import io
import os

from flask import abort, Blueprint, g, jsonify, make_response, render_template, request, Response, session, stream_with_context
from irods.message import iRODSMessage
from werkzeug.utils import secure_filename

research_bp = Blueprint('research_bp', __name__,
                        template_folder='templates',
                        static_folder='static/research',
                        static_url_path='/static')


@research_bp.route('/')
@research_bp.route('/browse')
def index():
    items = 10
    dir = request.args.get('dir')

    if dir is None:
        dir = ''

    # Search results data
    searchTerm = ''
    searchStatusValue = ''
    searchType = 'filename'
    searchStart = 0
    searchOrderDir = 'asc'
    searchOrderColumn = 0
    searchItemsPerPage = 10

    if 'research-search-term' in session or 'research-search-status-value' in session:
        if 'research-search-term' in session:
            searchTerm = session['research-search-term']
        if 'research-search-status-value' in session:
            searchStatusValue = session['research-search-status-value']

        searchType = session['research-search-type']
        searchStart = session['research-search-start']
        searchOrderDir = session['research-search-order-dir']
        searchOrderColumn = session['research-search-order-column']

    showStatus = False
    showTerm = False
    if searchType == 'status':
        showStatus = True
    else:
        showTerm = True

    # Get the HTML for search part
    searchHtml = render_template('research/search.html',
                                 searchTerm=searchTerm,
                                 searchStatusValue=searchStatusValue,
                                 searchType=searchType,
                                 searchStart=searchStart,
                                 searchOrderDir=searchOrderDir,
                                 searchOrderColumn=searchOrderColumn,
                                 showStatus=showStatus,
                                 showTerm=showTerm,
                                 searchItemsPerPage=searchItemsPerPage)

    return render_template('research/browse.html',
                           activeModule='research',
                           searchHtml=searchHtml,
                           items=items,
                           dir=dir)


@research_bp.route('/browse/download')
def download():
    path = '/' + g.irods.zone + '/home' + request.args.get('filepath')
    filename = path.rsplit('/', 1)[1]
    content = ''
    size = 0
    session = g.irods

    READ_BUFFER_SIZE = 1024 * io.DEFAULT_BUFFER_SIZE

    def read_file_chunks(path):
        obj = session.data_objects.get(path)
        with obj.open('r') as fd:
            while True:
                buf = fd.read(READ_BUFFER_SIZE)
                if buf:
                    yield buf
                else:
                    break

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


def get_chunk_name(uploaded_filename, chunk_number):
    return uploaded_filename + "_part_%03d" % chunk_number


@research_bp.route('/upload', methods=['GET'])
def upload_get():
    flow_identifier = request.args.get('flowIdentifier', type=str)
    flow_filename = secure_filename(request.args.get('flowFilename', type=str))
    flow_chunk_number = request.args.get('flowChunkNumber', type=int)

    filepath = request.args.get('filepath', type=str)

    if not flow_identifier or not flow_filename or not flow_chunk_number or not filepath:
        # Parameters are missing or invalid.
        response = make_response(jsonify({"message": "Parameter missing or invalid"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    # Build chunk folder path based on the parameters.
    temp_dir = os.path.join("/" + g.irods.zone, 'home', filepath, flow_identifier)

    # Chunk path based on the parameters.
    chunk_path = os.path.join(temp_dir, get_chunk_name(flow_filename, flow_chunk_number))

    session = g.irods
    if session.data_objects.exists(chunk_path):
        # Chunk already exists.
        response = make_response(jsonify({"message": "Chunk found"}), 200)
        response.headers["Content-Type"] = "application/json"
        return response
    else:
        # Chunk does not exists and needs to be uploaded.
        response = make_response(jsonify({"message": "Chunk not found"}), 204)
        response.headers["Content-Type"] = "application/json"
        return response


@research_bp.route('/upload', methods=['POST'])
def upload_post():
    flow_identifier = request.form.get('flowIdentifier', type=str)
    flow_filename = secure_filename(request.form.get('flowFilename', type=str))
    flow_chunk_number = request.form.get('flowChunkNumber', type=int)
    flow_total_chunks = request.form.get('flowTotalChunks', type=int)
    flow_chunk_size = request.form.get('flowChunkSize', type=int)
    flow_relative_path = request.form.get('flowRelativePath', type=str)

    relative_path = os.path.dirname(flow_relative_path)
    filepath = request.form.get('filepath', type=str)
    filepath = filepath.lstrip("/")

    if (not flow_identifier or not flow_filename or not flow_chunk_number
       or not flow_total_chunks or not flow_chunk_size or not filepath):
        # Parameters are missing or invalid.
        response = make_response(jsonify({"message": "Parameter missing or invalid"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    session = g.irods

    # Ensure temp chunk collection exists.
    if relative_path:
        base_dir = os.path.join("/" + g.irods.zone, 'home', filepath, relative_path)
        if not session.collections.exists(base_dir):
            session.collections.create(base_dir)
    else:
        base_dir = os.path.join("/" + g.irods.zone, 'home', filepath)

    # Get the chunk data.
    chunk_data = request.files['file']

    file_path = os.path.join(base_dir, flow_filename)
    if flow_chunk_number == 1:
        encode_unicode_content = iRODSMessage.encode_unicode(chunk_data.stream.read())

        try:
            with session.data_objects.open(file_path, 'w') as obj_desc:
                obj_desc.write(encode_unicode_content)

            obj_desc.close()
        except Exception:
            response = make_response(jsonify({"message": "Chunk upload failed"}), 500)
            response.headers["Content-Type"] = "application/json"
            return response
    else:
        encode_unicode_content = iRODSMessage.encode_unicode(chunk_data.stream.read())

        try:
            with session.data_objects.open(file_path, 'a') as obj_desc:
                # Go to the end of the file
                obj_desc.seek(0, 2)
                obj_desc.write(encode_unicode_content)

            obj_desc.close()
        except Exception:
            response = make_response(jsonify({"message": "Chunk upload failed"}), 500)
            response.headers["Content-Type"] = "application/json"
            return response

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@research_bp.route('/revision')
def revision():
    items = 10
    dlgPageItems = 10
    filter = request.args.get('filter')

    # Search results data
    searchTerm = filter
    searchStatusValue = ''
    searchType = 'revision'
    searchStart = 0
    searchOrderDir = 'asc'
    searchOrderColumn = 0
    searchItemsPerPage = 10
    showStatus = False
    showTerm = True

    # Get the HTML for search part
    searchHtml = render_template('research/search.html',
                                 searchTerm=searchTerm,
                                 searchStatusValue=searchStatusValue,
                                 searchType=searchType,
                                 searchStart=searchStart,
                                 searchOrderDir=searchOrderDir,
                                 searchOrderColumn=searchOrderColumn,
                                 showStatus=showStatus,
                                 showTerm=showTerm,
                                 searchItemsPerPage=searchItemsPerPage)

    return render_template('research/revision.html',
                           activeModule='research',
                           searchHtml=searchHtml,
                           items=items,
                           dlgPageItems=dlgPageItems,
                           filter=filter)


@research_bp.route('/metadata/form')
def form():
    path = request.args.get('path')

    return render_template('research/metadata-form.html', path=path)


@research_bp.route('/search/set_session', methods=['POST'])
def set_session():
    value = request.args.get('value')
    type = request.args.get('type')

    if type == 'status':
        session['research-search-status-value'] = value
    else:
        session['research-search-term'] = value
        session.pop('research-search-status-value', None)

    session['research-search-type'] = type
    session['research-search-start'] = 0

    return 'OK'


@research_bp.route('/search/unset_session')
def unset_session():
    session.pop('research-search-term', None)
    session.pop('research-search-start', None)
    session.pop('research-search-type', None)
    session.pop('research-search-order-dir', None)
    session.pop('research-search-order-column', None)
    session.pop('research-search-status-value', None)

    return 'OK'
