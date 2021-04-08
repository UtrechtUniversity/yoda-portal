#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, make_response, render_template, request

import api

group_bp = Blueprint('group_bp', __name__,
                     template_folder='templates',
                     static_folder='static/group_manager',
                     static_url_path='/static')


@group_bp.route('/example')
def index():
    response = api.call('group_data', data={})

    group_hierarchy = response['data']['group_hierarchy']
    user_type = response['data']['user_type']
    user_zone = response['data']['user_zone']

    return render_template('group_manager/index.html',
                           group_hierarchy=group_hierarchy,
                           user_type=user_type,
                           user_zone=user_zone)


@group_bp.route('/group_create', methods=['POST'])
def group_create():
    data_classification = request.form['group_data_classification'] if 'group_data_classification' in request.form else ''

    response = api.call('group_create', data={'group_name': request.form['group_name'],
                                              'category': request.form['group_category'],
                                              'subcategory': request.form['group_subcategory'],
                                              'description': request.form['group_description'],
                                              'data_classification': data_classification})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_bp.route('/group_delete', methods=['POST'])
def group_delete():
    response = api.call('group_delete', data={'group_name': request.form['group_name']})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_bp.route('/user_create', methods=['POST'])
def user_create():
    response = api.call('group_user_add', data={'username': request.form['user_name'],
                                                'group_name': request.form['group_name']})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_bp.route('/user_update', methods=['POST'])
def user_update():
    response = api.call('group_user_update_role', data={'username': request.form['user_name'],
                                                        'group_name': request.form['group_name'],
                                                        'new_role': request.form['new_role']})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output


@group_bp.route('/user_delete', methods=['POST'])
def user_delete():
    response = api.call('group_remove_user_from_group', data={'username': request.form['user_name'],
                                                              'group_name': request.form['group_name']})

    output = make_response({'status': 0 if response['status'] == 'ok' else 1, 'message': response['status_info']})
    output.headers["Content-type"] = "application/json"
    return output
