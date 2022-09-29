#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

#from flask import Blueprint, make_response, render_template, request, Response
#from irods.exception import CAT_NO_ACCESS_PERMISSION
#from irods.message import iRODSMessage
#from werkzeug.utils import secure_filename


from flask import abort, Blueprint, g, jsonify, make_response, render_template, request, Response, stream_with_context
from irods.exception import CAT_NO_ACCESS_PERMISSION
from irods.message import iRODSMessage
from werkzeug.utils import secure_filename

import api


group_manager_bp = Blueprint('group_manager_bp', __name__,
                             template_folder='templates',
                             static_folder='static/group_manager',
                             static_url_path='/assets')


@group_manager_bp.route('/')
def index() -> Response:
    response = api.call('group_data', data={})

    group_hierarchy = response['data']['group_hierarchy']
    user_type = response['data']['user_type']
    user_zone = response['data']['user_zone']

    return render_template('group_manager/index.html',
                           group_hierarchy=group_hierarchy,
                           user_type=user_type,
                           user_zone=user_zone)


@group_manager_bp.route('/get_categories', methods=['POST'])
def get_categories() -> Response:
    response = api.call('group_categories', data={})
    filter = request.form['query']

    categories = []
    for category in response['data']:
        if filter in category:
            categories.append(category)

    output = make_response({'categories': categories})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/get_subcategories', methods=['POST'])
def get_subcategories() -> Response:
    response = api.call('group_categories', data={})
    categories = response['data']
    category = request.form['category']
    filter = request.form['query']

    subcategories = []
    if category in categories:
        response = api.call('group_subcategories', data={'category': category})
        for subcategory in response['data']:
            if filter in subcategory:
                subcategories.append(subcategory)

    output = make_response({'subcategories': subcategories})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/get_users', methods=['POST'])
def get_users() -> Response:
    response = api.call('group_search_users', data={'pattern': request.form['query']})

    output = make_response({'users': response['data']})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/group_create', methods=['POST'])
def group_create() -> Response:
    data_classification = request.form['group_data_classification'] if 'group_data_classification' in request.form else ''

    response = api.call('group_create', data={'group_name': request.form['group_name'],
                                              'category': request.form['group_category'],
                                              'subcategory': request.form['group_subcategory'],
                                              'description': request.form['group_description'],
                                              'data_classification': data_classification})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/group_update', methods=['POST'])
def group_update() -> Response:
    properties = ['description', 'data_classification', 'category', 'subcategory']

    property_updated = False
    for property in properties:
        property_name = f"group_{property}"
        if property_name in request.form:
            property_updated = True
            value = request.form[property_name]
            response = api.call('group_update', data={'group_name': request.form['group_name'],
                                                      'property_name': property,
                                                      'property_value': value})

            if response['status'] != 'ok':
                break

    if not property_updated:
        response = {'status': 'ok', 'status_info': 'Nothing changed'}

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/group_delete', methods=['POST'])
def group_delete() -> Response:
    response = api.call('group_delete', data={'group_name': request.form['group_name']})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/user_create', methods=['POST'])
def user_create() -> Response:
    response = api.call('group_user_add', data={'username': request.form['user_name'],
                                                'group_name': request.form['group_name']})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/user_update', methods=['POST'])
def user_update() -> Response:
    response = api.call('group_user_update_role', data={'username': request.form['user_name'],
                                                        'group_name': request.form['group_name'],
                                                        'new_role': request.form['new_role']})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/user_delete', methods=['POST'])
def user_delete() -> Response:
    response = api.call('group_remove_user_from_group', data={'username': request.form['user_name'],
                                                              'group_name': request.form['group_name']})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/upload', methods=['GET'])
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


@group_manager_bp.route('/upload', methods=['POST'])
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
        # session.data_objects.move(object_path, final_object_path)

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response
