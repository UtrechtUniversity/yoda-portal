#!/usr/bin/env python3

__copyright__ = "Copyright (c) 2024, Utrecht University"
__license__   = "GPLv3, see LICENSE"

import json
from functools import wraps
from os import path
from typing import Any, Callable, Dict

from flask import (
    abort, Blueprint, current_app as app, flash, g, redirect,
    render_template, request, Response, session, url_for
)
from markupsafe import escape

import api
from util import length_check


# Blueprint configuration
admin_bp = Blueprint("admin_bp", __name__,
                     template_folder="templates/admin",
                     static_folder="static/admin",
                     static_url_path="/assets")


@admin_bp.route("/")
def index() -> Response:
    """Access the admin page if authorized.

    :returns: Rendered admin page or 403 access denied error
    """
    session['admin'] = api.call("admin_has_access", data={})["data"]

    if session['admin']:
        return render_template("admin.html")
    else:
        return abort(403)


def admin_required(f: Callable) -> Callable:
    """Decorator to check admin privileges.

    :param f: Function to decorate

    :returns: Wrapped function with admin check
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not getattr(g, 'admin', False):
            flash('You do not have permission to perform this action.', 'danger')
            return redirect(url_for('admin_bp.index'))
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/set_banner', methods=['POST'])
@admin_required
def set_banner() -> Response:
    """Set and save the banner message.

    :returns: Redirect to admin page with status message
    """
    banner_message = request.form.get('banner', '').strip()
    banner_message = escape(banner_message)  # Ensure safe text

    # Message length check
    error_message, is_valid = length_check(banner_message)
    if not is_valid:
        flash(error_message, "danger")
        return redirect(url_for('admin_bp.index'))

    # Update app config settings and save settings
    settings = {
        'banner_enabled': True,
        'banner_importance': 'importance' in request.form,
        'banner_message': banner_message
    }
    flash_msg = 'Set banner message successfully'
    return save_settings(settings, flash_msg)


@admin_bp.route('/remove_banner', methods=['POST'])
@admin_required
def remove_banner() -> Response:
    """Remove and save the banner settings.

    :returns: Redirect to admin page with status message
    """
    settings = {
        'banner_enabled': False,
        'banner_importance': False,
        'banner_message': ''
    }
    flash_msg = 'Banner removed successfully'
    return save_settings(settings, flash_msg)


def save_settings(settings: Dict[str, Any], flash_msg: str) -> Response:
    """Apply and persist settings.

    :param settings:  Settings dictionary
    :param flash_msg: Flash message on successful save

    :returns: Redirect with flash message
    """
    config_file_path = path.join(app.config['APP_SHARED_FOLDER'], 'banner_settings.json')
    app.config.update(settings)

    try:
        with open(config_file_path, 'w') as file:
            json.dump(settings, file)
        flash(flash_msg, 'success')
    except Exception:
        flash("Failed to save settings", "danger")
        return "Failed to save settings", 500

    return redirect(url_for('admin_bp.index'))
