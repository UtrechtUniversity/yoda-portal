#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, redirect, render_template, Response, url_for
from flask_wtf.csrf import CSRFError

general_bp = Blueprint('general_bp', __name__,
                       template_folder='templates/general',
                       static_folder='static/general',
                       static_url_path='/assets')


@general_bp.route('/')
def index() -> Response:
    return render_template('index.html')


@general_bp.app_errorhandler(CSRFError)
def csrf_error(e: Exception) -> Response:
    return redirect(url_for('user_bp.login'))


@general_bp.app_errorhandler(403)
def access_forbidden(e: Exception) -> Response:
    return render_template('403.html'), 403


@general_bp.app_errorhandler(404)
def page_not_found(e: Exception) -> Response:
    return render_template('404.html'), 404


@general_bp.app_errorhandler(500)
def internal_error(e: Exception) -> Response:
    return render_template('500.html'), 500
