#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Flask, g, redirect, request, url_for, send_from_directory
from flask_session import Session
from flask_wtf.csrf import CSRFProtect

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


from jinja2 import BaseLoader, TemplateNotFound
from flask import current_app

from os import path


class BlueprintLoader(BaseLoader):
    def get_source(self, environment, template):
        # First check user defined area
        user_templates_area = '/var/www/yoda/user-templates/'
        user_template_path = path.join(user_templates_area, template)
        if path.exists(user_template_path):
            source = ''
            with open(user_template_path) as f:
                source = f.read()
            return source, user_template_path, lambda: mtime == getmtime(user_template_path)

        for loader in (current_app.blueprints[request.blueprint].jinja_loader, current_app.blueprints['general_bp'].jinja_loader, current_app.jinja_loader):
            try:
                if loader:
                    return loader.get_source(environment, template)
            except TemplateNotFound:
                pass
        raise TemplateNotFound(template)


app = Flask(__name__, static_folder='assets')
# app = Flask(__name__)
app.jinja_env.loader = BlueprintLoader()

# assets_folder = os.path.join(app.root_path, 'assets')
@app.route('/assets/<path:filename>')
def assets(filename):
  print('In ASSETS handling')
  # Add custom handling here.
  assets_folder = 'blabla'
  # Send a file download response.
  return send_from_directory(assets_folder, filename)

#@app.route('/static/css/homepage.css', methods=['GET'])
#def static_from_root2():
#    print('We ZIJN HIERi CSS')
#    print(request.path[1:])
#    static_folder = '/var/www/yoda/user-templates/stats/static/css'
#    return send_from_directory(static_folder, request.path[1:])


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
def protect_pages():
    # To be globally defined - equal path for user templates
    user_area = '/var/www/yoda/user-templates/'

    # Static handling first
    # Added capability of overriding default static files by the same principle as the templates.

    # /assets/ and /module/assets is the construction of static files

    if '/assets/' in request.full_path:
        base = path.basename(request.path[1:])
        print(base)
        dir = path.dirname(request.path[1:])
        print(dir)

        parts = request.full_path.split('/')
        # print(parts)
        if parts[1]=='assets':
            # root handling
            # nog uitbreiden met check of andere bestaat!!
            # assets/img/frontpage_banner.jpg
            # dir = assets/img
            # base = frontpage_banner.jpg

            static_dir = dir.replace('assets', user_area + 'static')
            user_static_filename = path.join(static_dir, base)
            print('USER static filename')
            print(user_static_filename)
            if path.exists(user_static_filename):
                print('EXISTS')
                return send_from_directory(static_dir, base)
            else:
                print('NOT EXISTS')

                static_dir = dir.replace('assets', '/var/www/yoda/static')
                print(static_dir)
                return send_from_directory(static_dir, base)
 
        else:
            # module specific handling
            module = parts[1]

            specific_file_location = dir.replace(module + '/assets/', '')
            module_static_area = module + '/static/' + module + '/'

            user_static_filename = path.join(user_area + module_static_area + specific_file_location, base)

            # print('USER STATIC PATH')
            # print(user_area + module_static_area + specific_file_location + base)

            if path.exists(user_static_filename):
                # print('USER STATIC PATH EXISTS:')
                return send_from_directory(user_area + module_static_area + specific_file_location, base)
            else:
                # print('USER STATIC PATH NOT EXISTS:')
                static_dir = dir.replace(module + '/assets/', '/var/www/yoda/' + module + '/static/' + module + '/')
                # print(static_dir + base)
                return send_from_directory(static_dir, base)



    """
    print('Protect pages')
    if request.full_path.startswith('/assets/'):
        print('IS ASSET')
        # /assets/js/yoda.js?
        print(request.path[1:])
        base = path.basename(request.path[1:])
        print(base)
        dir = path.dirname(request.path[1:])
        print(dir)
        static_dir = dir.replace('assets', '/var/www/yoda/static')
        print(static_dir)
        return send_from_directory(static_dir, base)

    elif request.full_path.startswith('/stats/assets/'):
        print('IS STATS ASSET')
        # /assets/js/yoda.js?
        print(request.path[1:])
        base = path.basename(request.path[1:])
        print(base)
        dir = path.dirname(request.path[1:])
        print(dir)
        # base = select2.full.min.js
        # dir = stats/assets/lib/select2/js


        specific_file_location = dir.replace('stats/assets/', '')
        module_static_area = 'stats/static/stats/'

        user_static_filename = path.join(user_area + module_static_area + specific_file_location, base)

        print('USER STATIC PATH')
        print(user_area + module_static_area + specific_file_location + base)

        if path.exists(user_static_filename):
            print('USER STATIC PATH EXISTS:')
            return send_from_directory(user_area + module_static_area + specific_file_location, base)
        else:
            print('USER STATIC PATH NOT EXISTS:')
            static_dir = dir.replace('stats/assets/', '/var/www/yoda/stats/static/stats/')
            print(static_dir + base)
            return send_from_directory(static_dir, base)
    """


    """Restricted pages access protection."""
    if not request.endpoint or request.endpoint in ['general_bp.index',
                                                    'user_bp.login',
                                                    'user_bp.callback',
                                                    'api_bp.call',
                                                    'static']:
        return
    elif g.get('user', None) is not None:
        return
    else:
        return redirect(url_for('user_bp.login', redirect_target=request.full_path))


@app.after_request
def content_security_policy(response):
    """Add Content-Security-Policy headers."""
    if request.endpoint in ['research_bp.form', 'vault_bp.form']:
        response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: *.openstreetmap.org; frame-ancestors 'self'; form-action 'self'"  # noqa: E501
    else:
        response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'self'; form-action 'self'"  # noqa: E501
    return response
