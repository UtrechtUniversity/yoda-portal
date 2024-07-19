#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import json
from functools import wraps
from os import path
from typing import Any, Callable, Dict, Optional

from flask import (
    abort, Blueprint, current_app as app, flash, Flask, g, redirect,
    render_template, request, Response, url_for
)
from jinja2 import ChoiceLoader, FileSystemLoader
from markupsafe import escape

import api
from util import get_theme_directories, length_check

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
    has_admin_access = api.call("admin_has_access", data={})["data"]

    if has_admin_access:
        # reload theme options
        theme_directories = get_theme_directories(app.config.get('YODA_THEME_PATH'))
        return render_template("admin.html", theme_directories=theme_directories)
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
        'banner': {
            'banner_enabled': True,
            'banner_importance': 'importance' in request.form,
            'banner_message': banner_message
        }
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
        'banner': {
            'banner_enabled': False,
        }
    }
    flash_msg = 'Banner removed successfully'
    return save_settings(settings, flash_msg)


@admin_bp.route('/set_theme', methods=['POST'])
@admin_required
def set_theme() -> Response:
    """Set and save the YODA theme.

    :returns: Redirect to admin page with status message
    """
    # Load the selected theme
    theme = request.form.get('theme')

    # Load theme and save settings
    flash_msg = "Theme changed successfully."
    theme_settings = {'YODA_THEME': theme}
    return save_settings(theme_settings, flash_msg)


def save_settings(settings: Dict[str, Any], flash_msg: str) -> Response:
    """Apply and persist settings.

    :param settings:  Settings dictionary
    :param flash_msg: Flash message on successful save

    :returns: Redirect with flash message
    """
    setting_file_path = path.join(app.config['APP_SHARED_FOLDER'], 'admin_settings.json')
    app.config.update(settings)

    # Read existing settings
    try:
        with open(setting_file_path, 'r') as file:
            file_settings = json.load(file)
            file_settings.update(settings)
    except FileNotFoundError:
        flash("Settings file not found, will create a new one.", 'info')
    except json.JSONDecodeError:
        flash("Corrupted settings file, will overwrite.", 'warning')
    except Exception:
        flash("Unexpected error reading settings", 'danger')
        return "Failed to read settings", 500

    # Write the updated settings back to the file
    try:
        with open(setting_file_path, 'w') as file:
            json.dump(file_settings, file, indent=4)
    except Exception:
        flash("Failed to save settings", 'danger')
        return "Failed to save settings", 500

    if "YODA_THEME" in settings.keys():
        # Load the theme template if the current theme is changed
        set_theme_loader(app, remove_cache=True)

    flash(flash_msg, 'success')

    return redirect(url_for("admin_bp.index"))


def set_theme_loader(app: Flask, remove_cache: Optional[bool] = False) -> None:
    """
    Configures the template loader with the updated theme.

    :param app: The Flask application instance to configure.
    :param remove_cache: A boolean flag indicates whether to clear the template cache. Defaults to False.
    """
    # Target theme path
    theme_path = path.join(app.config.get('YODA_THEME_PATH'), app.config.get('YODA_THEME'))
    # Secondary theme path for scanning missing templates
    default_theme_path = "/var/www/yoda/general/templates/general"
    # Create theme path list to scan templates
    theme_path_lst = [theme_path, default_theme_path]

    # Load theme
    theme_loader = ChoiceLoader([
        FileSystemLoader(theme_path_lst),
        app.jinja_loader,
    ])
    app.jinja_loader = theme_loader

    # Remove template cache
    if remove_cache:
        if hasattr(app.jinja_env, 'cache'):
            app.jinja_env.cache = {}
