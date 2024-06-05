#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

# Blueprint for modular structure of codes
# redirect for directing users to various url
# render_template is based on Jinja2
from flask import Blueprint, redirect, render_template, Response, url_for
from flask_wtf.csrf import CSRFError

general_bp = Blueprint('general_bp', __name__,
                       template_folder='templates/general',
                       static_folder='static/general',
                       static_url_path='/assets')


@general_bp.route('/') # Root url
def index() -> Response: #Type Hint, response is a class in Flask
    return render_template('index.html')


@general_bp.app_errorhandler(CSRFError) #error handler for permission denied or reauthorization
def csrf_error(e: Exception) -> Response:
    return redirect(url_for('user_bp.login'))


@general_bp.app_errorhandler(403) #access forbidden
def access_forbidden(e: Exception) -> Response:
    return render_template('403.html'), 403


@general_bp.app_errorhandler(404) # no page
def page_not_found(e: Exception) -> Response:
    return render_template('404.html'), 404


@general_bp.app_errorhandler(500) # Internal server error
def internal_error(e: Exception) -> Response:
    return render_template('500.html'), 500
