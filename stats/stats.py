#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from datetime import datetime

from flask import Blueprint, jsonify, make_response, render_template, request, Response

import api

stats_bp = Blueprint('stats_bp', __name__,
                     template_folder='templates',
                     static_folder='static/stats',
                     static_url_path='/assets')


@stats_bp.route('/')
def index() -> Response:
    resource_tiers_response = api.call('resource_resource_and_tier_data', data={})
    group_response = api.call('resource_list_groups', data={})
    category_response = api.call('resource_category_stats', data={})

    has_access = False
    if (resource_tiers_response['data'] or group_response['data'] or category_response['data']):
        has_access = True

    return render_template('stats/stats.html',
                           resources=resource_tiers_response['data'],
                           groups=group_response['data'],
                           categories=category_response['data'],
                           access=has_access)


@stats_bp.route('get_tiers', methods=['GET'])
def get_tiers() -> Response:
    result = api.call('resource_get_tiers', data={})
    return jsonify(result['data'])


@stats_bp.route('resource_details', methods=['GET'])
def get_resource_details() -> Response:
    resource = request.args.get('resource')
    result = api.call('resource_tier', {'res_name': resource})
    html = render_template('stats/resource_tier_mgmt.html',
                           name=resource,
                           tier=result['data'])
    return {'status': 'success', 'html': html}


@stats_bp.route('/export')
def export() -> Response:
    response = api.call('resource_monthly_category_stats', data={})

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
