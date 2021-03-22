#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template

import api

general_bp = Blueprint('general_bp', __name__,
                       template_folder='templates/general',
                       static_folder='static/general',
                       static_url_path='/static')


@general_bp.route('/')
def index():
    return render_template('index.html')


@general_bp.route('/test')
def api_test():
    data = {"coll": "/tempZone/home"}
    response = api.call('browse_folder', data)
    # print(response)

    status = response['status']
    total = response['data']['total']

    return render_template('api_test.html', in_app={'status': status,
                                                    'total': total,
                                                    'response': response})
