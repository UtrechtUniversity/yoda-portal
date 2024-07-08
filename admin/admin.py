#!/usr/bin/env python3

__copyright__ = "Copyright (c) 2024, Utrecht University"
__license__ = "GPLv3, see LICENSE"

import json
from functools import wraps
from os import path

from flask import (
    abort, Blueprint, current_app as app, flash, g, redirect,
    render_template, request, Response, url_for
)
from markupsafe import escape

import api

# Blueprint configuration
admin_bp = Blueprint("admin_bp", __name__,
                     template_folder="templates/admin",
                     static_folder="static/admin",
                     static_url_path="/assets")


@admin_bp.route("/")
def index() -> Response:
    """Route to the admin page, if user has admin access."""
    has_admin_access = api.call("admin_has_access", data={})["data"]

    if has_admin_access:
        return render_template("admin.html")
    else:
        return abort(403)


def admin_required(f):
    """Decorator to check if the user has admin privileges."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not getattr(g, 'admin', False):
            flash('You do not have permission to perform this action.', 'danger')
            return redirect(url_for('admin_bp.index'))
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/set_banner', methods=['POST'])
@admin_required
def set_banner():
    """Set the banner message and persist it to the configuration file."""
    banner_message = request.form.get('banner', '').strip()
    banner_message = escape_html(banner_message)  # Ensure safe text

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
def remove_banner():
    """Remove banner message and save settings to the configuration file."""
    settings = {
        'banner_enabled': False,
        'banner_importance': False,
        'banner_message': ''
    }
    flash_msg = 'Banner removed successfully'
    return save_settings(settings, flash_msg)


def length_check(banner_message):
    """Validate the length and content of the banner message."""
    max_length = 256
    if not banner_message:
        return "Empty banner message found.", False
    elif len(banner_message) > max_length:
        return "Banner message too long.", False
    return None, True


def escape_html(text):
    """Escape HTML special characters in text."""
    return escape(text)


def save_settings(settings, flash_msg):
    """Apply and save the given settings to the configuration file."""
    config_file_path = path.join(app.config['APP_SHARED_FOLDER'], 'banner_settings.json')
    app.config.update(settings)
    try:
        with open(config_file_path, 'w') as file:
            json.dump(settings, file)
        flash(flash_msg, 'success')
    except IOError:
        flash(f"Failed to save settings", "danger")
        return f"Failed to save settings", 500

    return redirect(url_for('admin_bp.index'))
