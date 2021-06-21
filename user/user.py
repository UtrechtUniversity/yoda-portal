#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import json
import sys
from traceback import print_exc

import jwt
import requests
from flask import Blueprint, current_app as app, flash, g, redirect, render_template, request, session, url_for
from irods.exception import iRODSException, PAM_AUTH_PASSWORD_FAILED
from irods.session import iRODSSession

import api
import connman


# Blueprint creation
user_bp = Blueprint('user_bp', __name__,
                    template_folder='templates',
                    static_folder='static/user',
                    static_url_path='/static')


@user_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username is None:
            error = 'Missing username'
        else:
            try:
                irods_login(username, password)

            except PAM_AUTH_PASSWORD_FAILED:
                flash(
                    'Username/password was incorrect',
                    'error'
                )
                return redirect(url_for('user_bp.login'))
            except iRODSException as e:
                flash(
                    'An error occurred while connecting to iRODs. '
                    'If the issue persists, please contact the '
                    'system administrator',
                    'error'
                )
                print_exc()
                return redirect(url_for('user_bp.login'))

        redirect_target = request.args.get('redirect_target')
        if redirect_target is None:
            redirect_target = url_for('general_bp.index')

        return redirect(redirect_target)

    return render_template('user/login.html')


@user_bp.route('/logout')
def logout():
    connman.clean(session.sid)
    session.clear()
    return redirect(url_for('general_bp.index'))


@user_bp.route('/forgot-password')
def forgot_password():
    return render_template('user/login.html')


@user_bp.route('/notifications')
def notifications():
    response = api.call('notifications_load', data={})
    session['notifications'] = len(response['data'])
    return render_template(
        'user/notifications.html',
        notifications=response['data'])


@user_bp.route('/settings', methods=['GET', 'POST'])
def settings():
    if request.method == 'POST':
        # Build user settings dict.
        settings = {}
        if request.form.get('mail_notifications') != 'on':
            settings['mail_notifications'] = 'OFF'
        else:
            settings['mail_notifications'] = request.form.get('mail_notifications_type', "DAILY")

        # Save user settings and handle API response.
        data = {"settings": settings}

        response = api.call('settings_save', data)
        if response['status'] == 'ok':
            flash('Settings saved successfully', 'success')
        else:
            flash('Saving settings failed!', 'error')

    # Load user settings.
    response = api.call('settings_load', data={})
    settings = response['data']

    return render_template('user/settings.html', **settings)


@user_bp.route('/callback')
def callback():
    def token_request():
        code = request.args.get('code')
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': app.config.get('OIDC_CALLBACK_URI')
        }

        token_uri = app.config.get('OIDC_TOKEN_URI')

        # Content-type is application/x-www-form-urlencoded by default when data is a dict
        response = requests.post(
            token_uri,
            data,
            auth=(
                app.config.get('OIDC_CLIENT_ID'),
                app.config.get('OIDC_CLIENT_SECRET')
            )
        )

        return response

    def userinfo_request(token):
        userinfo_uri = app.config.get('OIDC_USERINFO_URI')
        response = requests.get(
            userinfo_uri,
            headers={
                'Authorization': 'Bearer {}'.format(token)
            }
        )

        return response

    token_response = None
    userinfo_response = None

    try:
        token_response = token_request()
        js           = token_response.json()
        access_token = js['access_token']
        id_token     = js['id_token']

        jwks_uri     = app.config.get('OIDC_JWKS_URI')
        jwks_client  = jwt.PyJWKClient(jwks_uri)
        signing_key  = jwks_client.get_signing_key_from_jwt(id_token)
        algorithms   = ['RS256']

        # Does verification of the token
        payload = jwt.decode(
            id_token,
            signing_key.key,
            algorithms,
            options=app.config.get('OIDC_JWT_OPTIONS'),
            audience=app.config.get('OIDC_CLIENT_ID'),
            issuer=app.config.get('OIDC_JWT_ISSUER')
        )

        userinfo_response = userinfo_request(access_token)

        email_identifier = app.config.get('OIDC_EMAIL_FIELD')
        email = userinfo_response.json()[email_identifier].lower()

        # Add a prefix to consume in the PAM stack
        access_token = '++oidc_token++'+ access_token

        irods_login(email, access_token)

    except (jwt.PyJWTError, json.decoder.JSONDecodeError, iRODSException, KeyError) as error:
        print_exc()

        if isinstance(error, jwt.PyJWTError):
            # Error occurred during steps for verification, configurations used can be found in flask.cfg
            print('Id Token:\n{}'.format(str(id_token)), file=sys.stderr)
        elif isinstance(error, json.decoder.JSONDecodeError):
            # Either token response or userinfo response decoding failed
            print('token_response + headers:\n{}\n\n{}'.format(token_response.headers, token_response.text), file=sys.stderr)
            if userinfo_response is not None:
                print(
                    'userinfo_response + headers:\n{}\n\n{}'.format(userinfo_response.headers, userinfo_response.text),
                    file=sys.stderr)
        elif isinstance(error, iRODSException):
            print('username: {}'.format(email), file=sys.stderr)
        elif isinstance(error, KeyError):
            # Missing key in token or userinfo response. The only one of interest is the latest response
            if userinfo_response is not None:
                print(
                    'userinfo_response + headers:\n{}\n{}'.format(userinfo_response.headers, userinfo_response.text),
                    file=sys.stderr)
            else:
                print('token_response + headers:\n{}\n{}'.format(token_response.headers, token_response.text), file=sys.stderr)

        flash(
            'An error occurred during the OpenID Connect protocol. '
            'If the issue persists, please contact the system '
            'administrator',
            'error'
        )
        return redirect(url_for('user_bp.login'))

    return redirect(url_for('general_bp.index'))


def irods_login(username, password):
    password = escape_irods_pam_password(password)

    irods = iRODSSession(
        host=app.config.get('IRODS_ICAT_HOSTNAME'),
        port=app.config.get('IRODS_ICAT_PORT'),
        user=username,
        password=password,
        zone=app.config.get('IRODS_DEFAULT_ZONE'),
        configure=True,
        **app.config.get('IRODS_SESSION_OPTIONS')
    )
    _ = irods.server_version
    session.clear()
    session['user_id'] = username
    session['password'] = password
    connman.add(session.sid, irods)


def escape_irods_pam_password(password):
    translation = str.maketrans({
        "@": r"\@",
        "=": r"\=",
        "&": r"\&",
        ";": r"\;"
    })

    return password.translate(translation)


@user_bp.before_app_request
def prepare_user():
    user_id = session.get('user_id', None)
    irods = connman.get(session.sid)

    if user_id is None:
        g.user = None
    elif irods is not None:
        g.user = user_id
        g.irods = irods

        # Check for notifications.
        response = api.call('notifications_load', data={})
        g.notifications = len(response['data'])
    else:
        redirect('user_bp.login')


@user_bp.after_app_request
def release_session(response):
    connman.release(session.sid)
    return response
