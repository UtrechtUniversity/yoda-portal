#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from os import path
from typing import Dict, Optional

from flask import Flask, g, redirect, request, Response, send_from_directory, url_for
from flask_session import Session
from flask_wtf.csrf import CSRFProtect
from jinja2 import ChoiceLoader, FileSystemLoader

from api import api_bp
from datarequest.datarequest import datarequest_bp
from deposit.deposit import deposit_bp
from general.general import general_bp
from group_manager.group_manager import group_manager_bp
from intake.intake import intake_bp
from open_search.open_search import open_search_bp
from research.research import research_bp
from search.search import search_bp
from stats.stats import stats_bp
from user.user import user_bp
from vault.vault import vault_bp


app = Flask(__name__, static_folder='assets')

# Load configurations
with app.app_context():
    app.config.from_pyfile('flask.cfg')

# Add theme loader.
theme_path = path.join(app.config.get('YODA_THEME_PATH'), app.config.get('YODA_THEME'))
theme_loader = ChoiceLoader([
    FileSystemLoader(theme_path),
    app.jinja_loader,
])
app.jinja_loader = theme_loader

# Setup values for the navigation bar used in
# general/templates/general/base.html
app.config['modules'] = []

if app.config.get('RESEARCH_ENABLED'):
    app.config['modules'].append(
        {'name': 'Research', 'function': 'research_bp.index'}
    )
if app.config.get('DEPOSIT_ENABLED'):
    app.config['modules'].append(
        {'name': 'Deposit', 'function': 'deposit_bp.index'}
    )
if app.config.get('INTAKE_ENABLED'):
    app.config['modules'].append(
        {'name': 'Intake', 'function': 'intake_bp.index'}
    )
if app.config.get('DATAREQUEST_ENABLED'):
    app.config['modules'].append(
        {'name': 'Datarequest', 'function': 'datarequest_bp.index'}
    )

app.config['modules'].append(
    {'name': 'Vault', 'function': 'vault_bp.index'},
)
app.config['modules'].append(
    {'name': 'Statistics', 'function': 'stats_bp.index'},
)
app.config['modules'].append(
    {'name': 'Group Manager', 'function': 'group_manager_bp.index'},
)

app.config['modules_list'] = [module['name'] for module in app.config['modules']]

# Default nr of items in browser list
app.config['browser-items-per-page'] = 10
# Default nr of items in search list
app.config['search-items-per-page'] = 10

# Start Flask-Session
Session(app)

# Register blueprints
with app.app_context():
    app.register_blueprint(general_bp)
    app.register_blueprint(group_manager_bp, url_prefix='/group_manager')
    app.register_blueprint(research_bp, url_prefix='/research')
    app.register_blueprint(stats_bp, url_prefix='/stats')
    app.register_blueprint(user_bp, url_prefix='/user')
    app.register_blueprint(vault_bp, url_prefix='/vault')
    app.register_blueprint(search_bp, url_prefix='/search')
    app.register_blueprint(api_bp, url_prefix='/api/')
    if app.config.get('DEPOSIT_ENABLED'):
        app.register_blueprint(deposit_bp, url_prefix='/deposit')
    if app.config.get('OPEN_SEARCH_ENABLED'):
        app.register_blueprint(open_search_bp, url_prefix='/open_search')
    if app.config.get('INTAKE_ENABLED'):
        app.register_blueprint(intake_bp, url_prefix='/intake')
    if app.config.get('DATAREQUEST_ENABLED'):
        app.register_blueprint(datarequest_bp, url_prefix='/datarequest/')

# XXX CSRF needs to be disabled for API testing.
csrf = CSRFProtect(app)


@app.before_request
def static_loader() -> Response:
    """
    Static files handling - recognisable through '/assets/'
    Override requested static file if present in user_static_area
    If not present fall back to the standard supplied static file

    This only works when the blueprint is created with static_url_path='/assets'
    The structure becomes
    /assets/ - for the root of the application
    /module/assets/ - for the modules of the application

    the corresponding file structure for static files is:
    /static
    /module/static/module/

    :returns: Static file
    """
    if '/assets/' in request.full_path:
        user_static_area = path.join(app.config.get('YODA_THEME_PATH'), app.config.get('YODA_THEME'))
        asset_dir, asset_name = path.split(request.path)
        parts = request.full_path.split('/')

        if parts[1] == 'assets':
            # Main assets
            static_dir = asset_dir.replace('/assets', user_static_area + '/static')
            user_static_filename = path.join(static_dir, asset_name)
            if not path.exists(user_static_filename):
                static_dir = asset_dir.replace('/assets', '/var/www/yoda/static')
        else:
            # Module specific assets
            module = parts[1]
            specific_file_location = asset_dir.replace('/' + module + '/assets/', '')
            module_static_area = path.join(module, 'static', module)
            user_static_filename = path.join(user_static_area, module_static_area, specific_file_location, asset_name)

            if path.exists(user_static_filename):
                static_dir = path.join(user_static_area, module_static_area, specific_file_location)
            else:
                static_dir = asset_dir.replace('/' + module + '/assets', '/var/www/yoda/' + module_static_area)

        return send_from_directory(static_dir, asset_name)


@app.before_request
def protect_pages() -> Optional[Response]:
    """Restricted pages access protection."""
    if not request.endpoint or request.endpoint in ['general_bp.index',
                                                    'user_bp.login',
                                                    'user_bp.gate',
                                                    'user_bp.callback',
                                                    'api_bp._call',
                                                    'static']:
        return None
    elif g.get('user', None) is not None:
        return None
    else:
        return redirect(url_for('user_bp.gate', redirect_target=request.full_path))


@app.after_request
def content_security_policy(response: Response) -> Response:
    """Add Content-Security-Policy headers."""
    if request.endpoint in ['research_bp.form', 'vault_bp.form', 'deposit_bp.metadata', 'vault_bp.metadata']:
        response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: *.openstreetmap.org; frame-ancestors 'self'; form-action 'self'; object-src 'none'"  # noqa: E501
    elif request.endpoint in ['user_bp.gate', 'user_bp.login']:
        response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'self'; form-action 'self' https:; object-src 'none'"  # noqa: E501
    else:
        response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'self'; form-action 'self'; object-src 'none'"  # noqa: E501

    return response


@app.url_defaults
def add_cache_buster(endpoint: str, values: Dict[str, str]) -> None:
    """Add cache buster to asset (static) URLs."""
    if endpoint.endswith("static"):
        values['q'] = app.config.get('YODA_COMMIT')
