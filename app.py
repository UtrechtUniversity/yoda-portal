#!/usr/bin/env python3

from flask import Flask, g, redirect, request, url_for
from flask_session import Session
from flask_wtf.csrf import CSRFProtect

from api.api import api_bp
from general.general import general_bp
from group_manager.group_manager import group_bp
from research.research import research_bp
from stats.stats import stats_bp
from user.user import user_bp
from vault.vault import vault_bp
from intake.intake import intake_bp
from datarequest.datarequest import datarequest_bp

app = Flask(__name__)
app.config.from_pyfile('flask.cfg')
app.config['modules'] = [
     {'name': 'Research', 'function': 'research_bp.index'}
    ,{'name': 'Vault', 'function': 'vault_bp.index'}
    ,{'name': 'Statistics', 'function': 'stats_bp.index'}
    ,{'name': 'Group Manager', 'function': 'group_bp.index'}
    ,{'name': 'Datarequest', 'function': 'datarequest_bp.index'}
    ]
if app.config.get('INTAKE_ENABLED'):
    app.config['modules'].append(
        {'name': 'Intake', 'function': 'intake_bp.index'} 
    )
endif
if app.config.get('DATAREQUEST_ENABLED'):
    app.config['modules'].append(
        {'name': 'Datarequest', 'function': 'datarequest_bp.index'}
    )
endif

# Start Flask-Session
Session(app)

# Register blueprints
app.register_blueprint(general_bp)
app.register_blueprint(group_bp, url_prefix='/group')
app.register_blueprint(research_bp, url_prefix='/research')
app.register_blueprint(stats_bp, url_prefix='/statistics')
app.register_blueprint(user_bp, url_prefix='/user')
app.register_blueprint(vault_bp, url_prefix='/vault')
app.register_blueprint(api_bp, url_prefix='/api/')
app.register_blueprint(intake_bp, url_prefix='/intake/')
app.register_blueprint(datarequest_bp, url_prefix='/datarequest/')
# XXX CSRF needs to be disabled for API testing.
csrf = CSRFProtect(app)


# Restricted access protection
@app.before_request
def protect_pages():
    if not request.endpoint or request.endpoint in ['general_bp.index', 'user_bp.login', 'static']:
        return
    elif g.user is not None:
        return
    else:
        return redirect(url_for('user_bp.login'))


# Authentication handling {{{

# @app.after_request
def release_irods(x):
    if 'session' in dir(g) and g.session.lock.locked():
        g.session.lock.release()

    # XXX: For API testing.
    x.headers.add('Access-Control-Allow-Origin',  '*')
    x.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    x.headers.add('Access-Control-Allow-Methods', 'GET,POST')
    return x

# }}}
