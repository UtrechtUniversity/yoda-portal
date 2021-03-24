#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template

import api

stats_bp = Blueprint('stats_bp', __name__,
                     template_folder='templates/stats',
                     static_folder='static/stats',
                     static_url_path='/static')


@stats_bp.route('/')
def index():
    response = api.call('resource_list_groups', data={})
    groups = response['data']
    return render_template('stats.html', groups=groups)
