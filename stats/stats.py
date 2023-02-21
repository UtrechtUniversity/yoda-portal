#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2023, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, make_response, render_template, Response

import api

stats_bp = Blueprint('stats_bp', __name__,
                     template_folder='templates',
                     static_folder='static/stats',
                     static_url_path='/assets')


@stats_bp.route('/')
def index() -> Response:
    # resource_tiers_response = api.call('resource_resource_and_tier_data', data={})
    category_response = api.call('resource_category_stats', data={})

    return render_template('stats/stats.html',
                           categories=category_response['data'])


@stats_bp.route('/export')
def export() -> Response:
    response = api.call('resource_monthly_category_stats', data={})

    csv = "category;subcategory;groupname;"

    periods = ";".join(response['data']['dates'])

    csv += periods + "\n"

    for stat in response['data']['storage']:
        csv += f"{stat['category']};{stat['subcategory']};{stat['groupname']};"
        for month in stat['storage']:
            csv += f"{month};"
        csv += "\n"

    output = make_response(csv)
    output.headers["Content-Disposition"] = "attachment; filename=export.csv"
    output.headers["Content-type"] = "text/csv"
    return output
