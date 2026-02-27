#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import csv
from io import StringIO

from flask import Blueprint, make_response, render_template, Response

import api
from cache_config import cache_view

stats_bp = Blueprint('stats_bp', __name__,
                     template_folder='templates',
                     static_folder='static/stats',
                     static_url_path='/assets')


@stats_bp.route('/')
@cache_view()
def index() -> Response:
    category_response = api.call('resource_category_stats', data={})

    return render_template('stats/stats.html',
                           categories=category_response['data']['categories'],
                           external_filter=category_response['data']['external_filter'])


@stats_bp.route('/export')
@cache_view()
def export() -> Response:
    response = api.call('resource_monthly_category_stats', data={})

    if len(response['data']['dates']) == 0:
        output = make_response('No storage data was found.')
        output.headers["Content-Disposition"] = "attachment; filename=NoStorageDataFound.csv"
        output.headers["Content-type"] = "text/csv"
        return output

    csvdata = StringIO()
    fieldnames = ["category", "subcategory", "groupname"] + response['data']['dates']
    writer = csv.writer(csvdata, delimiter=';', lineterminator='\n')
    writer.writerow(fieldnames)

    for stat in response['data']['storage']:
        writer.writerow([
            stat['category'],
            stat['subcategory'],
            stat['groupname'],
            *stat['storage']
        ])

    output = make_response(csvdata.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=export.csv"
    output.headers["Content-type"] = "text/csv"
    return output
