#!/usr/bin/env python3

from flask import Flask
from flask import request, Response
from flask import session
from flask import g
from flask import render_template, redirect, url_for
from flask_wtf.csrf import CSRFProtect
from flask_session import Session
import json
import config
from general.general import general_bp
from group_manager.group_manager import group_bp 
from research.research import research_bp
from vault.vault import vault_bp
from stats.stats import stats_bp
from user.user import user_bp
from api.api import api_bp

app = Flask(__name__)
app.config['SECRET_KEY']        = config.secret_key
app.config['portalTitleText']   = config.portal_title_text
app.config['logoUrl']           = config.logo_url
app.config['YODA_VERSION']      = config.yoda_version
app.config['YODA_COMMIT']       = config.yoda_commit
app.config['modules']           = config.modules

app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_HTTPONLY'] = True 
app.config['SESSION_COOKIE_SECURE'] = True
#app.config['PERMANENT_SESSION_LIFETIME'] = 30 * 60 # in seconds, so 30 minutes
#app.config['SESSION_PERMANENT'] = False # default True
app.config['SESSION_USE_SIGNER'] = True # Use signer for cookie session sid
app.config['SESSION_FILE_DIR'] = '/tmp/flask_session/' # default flask_session under current working dir 

Session(app)

# add datarequest + other optional modules via ansible
# and register them below

app.register_blueprint(general_bp)
app.register_blueprint(group_bp, url_prefix = '/group')
app.register_blueprint(research_bp, url_prefix = '/research')
app.register_blueprint(stats_bp, url_prefix = '/statistics')
app.register_blueprint(user_bp, url_prefix = '/user')
app.register_blueprint(vault_bp, url_prefix = '/vault')
app.register_blueprint(api_bp, url_prefix = '/api/')

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

#@app.after_request
def release_irods(x):
    if 'session' in dir(g) and g.session.lock.locked():
        g.session.lock.release()

    # XXX: For API testing.
    x.headers.add('Access-Control-Allow-Origin',  '*')
    x.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    x.headers.add('Access-Control-Allow-Methods', 'GET,POST')
    return x

# }}}
