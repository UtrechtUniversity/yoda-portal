#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

# Blueprint for modular structure of codes
# redirect for directing users to various url
# render_template is based on Jinja2
from flask import Blueprint, redirect, render_template, Response, url_for
from flask_wtf.csrf import CSRFError

admin_bp = Blueprint('admin_bp', __name__,
                       template_folder='templates/admin',
                       static_folder='static/admin',
                       static_url_path='/assets')


@admin_bp.route('/') # Root url
def index() -> Response: #Type Hint, response is a class in Flask
    #TODO: ADD category response from api (talked to irods)
    # E.g,: category_response = api.call('resource_category_stats', data={})
    return render_template('admin.html')
