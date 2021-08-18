#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from os import path

from flask import current_app, Flask, g, redirect, request, send_from_directory, url_for
from flask_session import Session
from flask_wtf.csrf import CSRFProtect
from jinja2 import BaseLoader, TemplateNotFound

from api import api_bp
from datarequest.datarequest import datarequest_bp
from deposit.deposit import deposit_bp
from general.general import general_bp
from group_manager.group_manager import group_manager_bp
from intake.intake import intake_bp
from research.research import research_bp
from stats.stats import stats_bp
from user.user import user_bp
from vault.vault import vault_bp


class BlueprintLoader(BaseLoader):
    def get_source(self, environment, template):
        # First for template in user defined area.
        user_templates_area = app.config.get('YODA_THEME_PATH') + '/' + app.config.get('YODA_THEME') + '/'
        user_template_path = path.join(user_templates_area, template)

        if path.exists(user_template_path):
            source = ''
            with open(user_template_path) as f:
                source = f.read()
            return source, user_template_path, False

        for loader in (current_app.blueprints[request.blueprint].jinja_loader,
                       current_app.blueprints['general_bp'].jinja_loader,
                       current_app.jinja_loader):
            try:
                if loader:
                    return loader.get_source(environment, template)
            except TemplateNotFound:
                pass
        raise TemplateNotFound(template)


app = Flask(__name__, static_folder='assets')
app.jinja_env.loader = BlueprintLoader()

# Load configurations
with app.app_context():
    app.config.from_pyfile('flask.cfg')

# Setup values for the navigation bar used in
# general/templates/general/base.html
app.config['modules'] = [
    {'name': 'Deposit',        'function': 'deposit_bp.index'},
    {'name': 'Research',       'function': 'research_bp.index'},
    {'name': 'Vault',          'function': 'vault_bp.index'},
    {'name': 'Statistics',     'function': 'stats_bp.index'},
    {'name': 'Group Manager',  'function': 'group_manager_bp.index'},
]
if app.config.get('INTAKE_ENABLED'):
    app.config['modules'].append(
        {'name': 'Intake', 'function': 'intake_bp.index'}
    )
if app.config.get('DATAREQUEST_ENABLED'):
    app.config['modules'].append(
        {'name': 'Datarequest', 'function': 'datarequest_bp.index'}
    )

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
    app.register_blueprint(deposit_bp, url_prefix='/deposit')
    app.register_blueprint(api_bp, url_prefix='/api/')
    if app.config.get('INTAKE_ENABLED'):
        app.register_blueprint(intake_bp, url_prefix='/intake/')
    if app.config.get('DATAREQUEST_ENABLED'):
        app.register_blueprint(datarequest_bp, url_prefix='/datarequest/')

# XXX CSRF needs to be disabled for API testing.
csrf = CSRFProtect(app)


@app.before_request
def static_loader():
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
        user_static_area = app.config.get('YODA_THEME_PATH') + '/' + app.config.get('YODA_THEME') + '/'
        dir, base = path.split(request.path)
        parts = request.full_path.split('/')

        if parts[1] == 'assets':
            static_dir = dir.replace('assets', user_static_area + 'static')
            user_static_filename = path.join(static_dir, base)
            if path.exists(user_static_filename):
                return send_from_directory(static_dir, base)
            else:
                static_dir = dir.replace('assets', '/var/www/yoda/static')
                return send_from_directory(static_dir, base)
        else:
            # module specific handling
            module = parts[1]
            specific_file_location = dir.replace(module + '/assets/', '')
            module_static_area = module + '/static/' + module + '/'
            user_static_filename = path.join(user_static_area + module_static_area + specific_file_location, base)

            if path.exists(user_static_filename):
                return send_from_directory(user_static_area + module_static_area + specific_file_location, base)
            else:
                static_dir = dir.replace(module + '/assets/', '/var/www/yoda/' + module + '/static/' + module + '/')
                return send_from_directory(static_dir, base)


@app.before_request
def protect_pages():
    """Restricted pages access protection."""
    if not request.endpoint or request.endpoint in ['general_bp.index',
                                                    'user_bp.login',
                                                    'user_bp.gate',
                                                    'user_bp.callback',
                                                    'api_bp.call',
                                                    'static']:
        return
    elif g.get('user', None) is not None:
        return
    else:
        return redirect(url_for('user_bp.gate', redirect_target=request.full_path))


@app.after_request
def content_security_policy(response):
    """Add Content-Security-Policy headers."""
    if request.endpoint in ['research_bp.form', 'vault_bp.form']:
        response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: *.openstreetmap.org; frame-ancestors 'self'; form-action 'self'"  # noqa: E501
    else:
        response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'self'; form-action 'self'"  # noqa: E501
    return response
