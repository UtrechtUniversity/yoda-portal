#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, redirect, render_template, url_for, session
from flask_wtf.csrf import CSRFError
import connman

general_bp = Blueprint('general_bp', __name__,
                       template_folder='templates/general',
                       static_folder='static/general',
                       static_url_path='/static')


@general_bp.route('/')
def index():
    conn = connman.get(session.sid)
    if conn:
        return render_template('index_loggedin.html')
    return render_template('index.html')

@general_bp.app_errorhandler(CSRFError)
def csrf_error(e):
    return redirect(url_for('user_bp.login'))


@general_bp.app_errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@general_bp.app_errorhandler(500)
def internal_error(e):
    return render_template('500.html'), 500
