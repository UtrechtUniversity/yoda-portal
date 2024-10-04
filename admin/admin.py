#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import html
import json
from functools import wraps
from os import path
from typing import Any, Callable, Dict, Optional

from flask import (
    abort,
    Blueprint,
    flash,
    Flask,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    Response,
    session,
    url_for,
)
from flask import current_app as app
from jinja2 import ChoiceLoader, FileSystemLoader
from markupsafe import escape

from irods.message import iRODSMessage
from werkzeug.utils import secure_filename

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
    session['admin'] = api.call("admin_has_access", data={})["data"]

    if session['admin']:
        # reload theme options
        theme_directories = get_theme_directories(app.config.get('YODA_THEME_PATH'))
        publication_terms_text = get_publication_terms()
        return render_template("admin.html", theme_directories=theme_directories, publication_terms=publication_terms_text)

    else:
        return abort(403)


def admin_required(f: Callable) -> Callable:
    """Decorator to check admin privileges.

    :param f: Function to decorate

    :returns: Wrapped function with admin check
    """
    @wraps(f)
    def decorated_function(*args: str, **kwargs: int) -> Callable:
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
    message = request.form.get('banner', '').strip()
    message = escape(message)  # Ensure safe text

    # Message length check
    error_message, is_valid = length_check(message)
    if not is_valid:
        flash(error_message, "danger")
        return redirect(url_for('admin_bp.index'))

    # Update app config settings and save settings
    settings = {
        'banner': {
            'enabled': True,
            'importance': 'importance' in request.form,
            'message': message
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
            'enabled': False,
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

    # Input validation
    valid_themes = get_theme_directories(app.config.get('YODA_THEME_PATH'))
    if theme not in valid_themes:
        flash('Invalid theme selected.', 'error')
        return redirect(url_for('admin_bp.index'))

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
    setting_file_path = path.join(app.config['YODA_CONFIG_PATH'], 'admin_settings.json')
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

    if "YODA_THEME" in settings:
        # Load the theme template if the current theme is changed
        set_theme_loader(app, remove_cache=True)

    flash(flash_msg, 'success')

    return redirect(url_for("admin_bp.index"))


def set_theme_loader(app: Flask, remove_cache: Optional[bool] = False) -> None:
    """
    Configures the template loader with the updated theme.

    :param app:          Flask application instance
    :param remove_cache: Boolean flag indicating whether to clear the template cache. Defaults to False
    """
    # Target theme path
    theme_path = path.join(app.config.get('YODA_THEME_PATH'), app.config.get('YODA_THEME'))
    # Secondary theme path for scanning missing templates
    default_theme_path = path.join(app.config.get('YODA_PORTAL_PATH'), 'general/templates/general')
    # Create theme path list to scan templates
    theme_path_lst = [theme_path, default_theme_path]

    # Load theme
    theme_loader = ChoiceLoader([
        FileSystemLoader(theme_path_lst),
        app.jinja_loader,
    ])
    app.jinja_loader = theme_loader

    # Remove template cache
    if remove_cache and hasattr(app.jinja_env, 'cache'):
        app.jinja_env.cache = {}


@admin_bp.route('/set_publication_terms', methods=['POST'])
@admin_required
def set_publication_terms() -> Response:
    """Receives new publication terms from a POST request, sanitizes, and saves them.

    :return: A redirection response to the admin index page.
    """
    # Retrives new terms from the POST request
    new_terms = request.form['publicationTerms']
    sanitized_terms = html.escape(new_terms)

    # Save new terms to local file
    try:
        publication_terms_path = path.join(app.config['YODA_CONFIG_PATH'], 'publication_terms.html')
        with open(publication_terms_path, 'w') as file:
            file.write(sanitized_terms)
        flash("Publication terms updated successfully.", "success")
        return redirect(url_for("admin_bp.index"))
    except Exception:
        flash("Failed to update publication terms", "error")

    return redirect(url_for("admin_bp.index"))


@admin_bp.route("/get_publication_terms")
def publication_terms() -> Response:
    """Retrieve and return the current publication terms as JSON.

    :return: JSON object containing the current publication terms.
    """
    terms = get_publication_terms()
    return jsonify({'terms': terms})


def get_publication_terms()  -> Optional[str]:
    """Retrieve publication terms from a local file or from an iRODS API fallback.

    :return: A string containing the html-like publication terms.
    """
    publication_terms_path = path.join(app.config['YODA_CONFIG_PATH'], 'publication_terms.html')

    # Attempt to read from local file
    if path.exists(publication_terms_path):
        try:
            with open(publication_terms_path, 'r') as file:
                publication_terms_html = file.read()
                return html.unescape(publication_terms_html)  # Convert escaped terms to html
        except Exception:
            flash("Failed to load publication terms from file.", "error")

    # Fallback to API if the file does not exist or an error occurred
    try:
        response = api.call('vault_get_publication_terms', {})
        publication_terms_html = response["data"]

        # Save the data to a local file if it was fetched from the API
        try:
            with open(publication_terms_path, 'w') as file:
                file.write(html.escape(publication_terms_html))
        except Exception:
            flash("Failed to save publication terms to file", "error")

        return publication_terms_html
    except Exception:
        flash("Failed to load publication terms from API", "error")

    return "Error: failed to read publication terms"


@admin_bp.route('/upload_file_formats', methods=['POST'])
@admin_required
def upload_file_formats():
    filename = secure_filename(request.files['file'].filename)
    if not filename.endswith('.json'):
        flash("Uploaded file for file formats is not a JSON file.", "danger")
        return redirect(url_for("admin_bp.index"))

    file_path = path.join("/" + g.irods.zone, 'yoda', 'file_formats', filename)

    # Get the chunk data.
    data = request.files['file']
    encode_unicode_content = iRODSMessage.encode_unicode(data.stream.read())

    try:
        with g.irods.data_objects.open(file_path, 'w') as obj_desc:
            obj_desc.write(encode_unicode_content)
        obj_desc.close()
        flash("File Formats uploaded successfully.", "success")
    except Exception:
        flash("Failed to upload File Formats", "error")

    return redirect(url_for("admin_bp.index"))


@admin_bp.route('/delete_file_formats', methods=['POST'])
@admin_required
def delete_file_formats():
    filename = request.form.get('filename')

    if not filename:
        flash("No File Formats specified for deletion.", "danger")
        return redirect(url_for("admin_bp.index"))

    file_path = path.join("/" + g.irods.zone, 'yoda', 'file_formats', filename + '.json')

    try:
        g.irods.data_objects.unlink(file_path, force=False)
        flash(f"File Formats '{filename}' deleted successfully.", "success")
    except Exception:
        flash("Failed to delete File Formats.", "danger")

    return redirect(url_for("admin_bp.index"))
