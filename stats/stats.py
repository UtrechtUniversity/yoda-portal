#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, make_response, render_template

import api

stats_bp = Blueprint('stats_bp', __name__,
                     template_folder='templates/stats',
                     static_folder='static/stats',
                     static_url_path='/static')


@stats_bp.route('/')
def index():
    group_response = api.call('resource_list_groups', data={})
    category_response = api.call('resource_category_stats', data={})
    return render_template('stats.html',
                           groups=group_response['data'],
                           categories=category_response['data'])


@stats_bp.route('/export')
def export():
    output = make_response("cvs, file, test\n1 , 2, 3")
    output.headers["Content-Disposition"] = "attachment; filename=export.csv"
    output.headers["Content-type"] = "text/csv"
    return output
