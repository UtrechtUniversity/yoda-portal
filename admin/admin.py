#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template, Response

admin_bp = Blueprint('admin_bp', __name__,
                     template_folder='templates/admin',
                     static_folder='static/admin',
                     static_url_path='/assets')


@admin_bp.route('/')
def index() -> Response:
    # TODO: ADD category response for communicating to irods
    # E.g.,: category_response = api.call('resource_category_stats', data={})
    return render_template('admin.html')
