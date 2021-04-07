#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template

general_bp = Blueprint('general_bp', __name__,
                       template_folder='templates/general',
                       static_folder='static/general',
                       static_url_path='/static')


@general_bp.route('/')
def index():
    return render_template('index.html')


@general_bp.app_errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@general_bp.app_errorhandler(500)
def internal_error(e):
    return render_template('500.html'), 500
