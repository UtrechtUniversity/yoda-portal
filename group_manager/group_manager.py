#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, make_response, render_template, request, Response

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

    response = api.call('schema_get_schemas', data={})
    schema_ids = response['data']

    return render_template('group_manager/index.html',
                           group_hierarchy=group_hierarchy,
                           schema_ids=schema_ids,
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


@group_manager_bp.route('/get_schemas', methods=['POST'])
def get_schemas() -> Response:
    response = api.call('schema_get_schemas', data={})

    schemas = []
    for schema in response['data']:
        schemas.append(schema)

    output = make_response({'schemas': schemas})
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
    schema_id = request.form['group_schema_id'] if 'group_schema_id' in request.form else ''
    data_classification = request.form['group_data_classification'] if 'group_data_classification' in request.form else ''
    expiration_date = request.form['group_expiration_date'] if 'group_expiration_date' in request.form else ''

    response = api.call('group_create', data={'group_name': request.form['group_name'],
                                              'category': request.form['group_category'],
                                              'subcategory': request.form['group_subcategory'],
                                              'schema_id': schema_id,
                                              'expiration_date': expiration_date,
                                              'description': request.form['group_description'],
                                              'data_classification': data_classification})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_manager_bp.route('/group_update', methods=['POST'])
def group_update() -> Response:
    properties = ['description', 'data_classification', 'category', 'subcategory', 'expiration_date']

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
