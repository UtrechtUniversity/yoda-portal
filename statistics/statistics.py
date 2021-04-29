#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from datetime import datetime

from flask import Blueprint, make_response, render_template

import api

statistics_bp = Blueprint('statistics_bp', __name__,
                          template_folder='templates',
                          static_folder='static/statistics',
                          static_url_path='/static')


@statistics_bp.route('/')
def index():
    group_response = api.call('resource_list_groups', data={})
    category_response = api.call('resource_category_statistics', data={})
    return render_template('statistics/statistics.html',
                           groups=group_response['data'],
                           categories=category_response['data'])


@statistics_bp.route('/export')
def export():
    response = api.call('resource_monthly_category_statistics', data={})

    csv = "category;subcategory;groupname;tier;"

    months = ['January', 'February', 'March', 'April',
              'May', 'June', 'July', 'August',
              'September', 'October', 'November', 'December']
    current_month = datetime.now().month
    for i in range(11, -1, -1):
        month = (current_month - i) + 12 if (current_month - i) < 0 else current_month - i
        csv += "{};".format(months[month - 1])
    csv += "\n"

    for stat in response['data']:
        csv += "{};{};{};{};".format(stat['category'], stat['subcategory'], stat['groupname'], stat['tier'])
        for month in stat['storage']:
            csv += "{};".format(month)
        csv += "\n"

    output = make_response(csv)
    output.headers["Content-Disposition"] = "attachment; filename=export.csv"
    output.headers["Content-type"] = "text/csv"
    return output
