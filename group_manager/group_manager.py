#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import json

from flask import Blueprint, render_template

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
