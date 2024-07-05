#!/usr/bin/env python3

__copyright__ = "Copyright (c) 2024, Utrecht University"
__license__   = "GPLv3, see LICENSE"

from flask import abort, Blueprint, render_template, request, Response
import json
from flask import flash, current_app as app
from werkzeug.exceptions import BadRequest
import api
from flask import redirect, url_for
from os import path
from markupsafe import escape

admin_bp = Blueprint("admin_bp", __name__,
                     template_folder="templates/admin",
                     static_folder="static/admin",
                     static_url_path="/assets")


@admin_bp.route("/")
def index() -> Response:
    """Route to the admin page, if user has admin access"""
    has_admin_access = api.call("admin_has_access", data={})["data"]

    if has_admin_access:
        return render_template("admin.html")
    else:
        return abort(403)

# TODO: Code reability
# TODO: Automation Test
def validate_banner_message(banner_message):
    """Validate the length and content of the banner message."""
    max_length = 256
    if not banner_message:
        return "Empty banner message found.", False
    elif len(banner_message) > max_length:
        return "Banner message too long.", False
    return None, True

def escape_html(text):
    """Escape HTML special characters in text."""
    return escape(text)  # Assuming `escape` is from an imported module

@admin_bp.route('/set_banner', methods=['POST'])
def set_banner():
    """Set up banner operations and save settings to web server's config files."""
    banner_message = request.form.get('banner', '').strip()
    banner_message = escape_html(banner_message)  # Ensure safe text
    error_message, is_valid = validate_banner_message(banner_message)

    if not is_valid:
        flash(error_message, "danger")
        return redirect(url_for('admin_bp.index'))

    is_important = 'importance' in request.form
    settings = {
        'BANNER_ENABLED': True,
        'banner_importance': is_important,
        'banner_message': banner_message
    }
    flash_msg = 'Set banner message successfully'
    return save_settings(settings, flash_msg)

@admin_bp.route('/remove_banner', methods=['POST'])
def remove_banner():
    """Remove banner operations and save settings to web server's config files."""
    settings = {
        'BANNER_ENABLED': False,
        'banner_importance': False,
        'banner_message': ''
    }
    flash_msg = 'Banner removed successfully'
    return save_settings(settings, flash_msg)

def save_settings(settings, flash_msg):
    """Save settings to the configuration file."""
    config_file_path = path.join(app.config['APP_SHARED_FOLDER'], 'banner_settings.json')
    app.config.update(settings)
    try:
        with open(config_file_path, 'w') as file:
            json.dump(settings, file)
        flash(flash_msg, 'success')
    except IOError as e:
        flash(f"Failed to save settings: {str(e)}", "danger")
        return f"Failed to save settings: {e}", 500

    return redirect(url_for('admin_bp.index'))
