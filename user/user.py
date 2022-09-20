#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import json
from typing import List

import jwt
import requests
from flask import Blueprint, current_app as app, flash, g, redirect, render_template, request, Response, session, url_for
from irods.exception import CAT_INVALID_AUTHENTICATION, CAT_INVALID_USER, iRODSException, PAM_AUTH_PASSWORD_FAILED
from irods.session import iRODSSession

import api
import connman
from util import log_error

# Blueprint creation
user_bp = Blueprint('user_bp', __name__,
                    template_folder='templates',
                    static_folder='static/user',
                    static_url_path='/assets')


@user_bp.route('/gate', methods=['GET', 'POST'])
def gate() -> Response:
    if request.method == 'POST':
        username: str = request.form.get('username', '').lower().strip()

        if username == '':
            flash('Missing username', 'danger')
            return render_template('user/gate.html')

        if len(username) > 64:
            flash('Invalid username', 'danger')
            return render_template('user/gate.html')

        session['login_username'] = username

        redirect_target = request.args.get('redirect_target')
        if redirect_target is not None:
            session['redirect_target'] = redirect_target

        # If the username matches the domain set for OIDC
        if should_redirect_to_oidc(username):
            return redirect(oidc_authorize_url(username))
        # Else (i.e. it is an external user, local user, or OIDC is disabled)
        else:
            return redirect(url_for('user_bp.login'))

    return render_template('user/gate.html')


@user_bp.route('/login', methods=['GET', 'POST'])
def login() -> Response:
    if request.method == 'POST':
        username: str = request.form.get('username', '').lower().strip()
        password: str = request.form.get('password', '')

        if username == '':
            flash('Missing username', 'danger')
            return render_template('user/login.html')

        if len(username) > 64:
            flash('Invalid username', 'danger')
            return render_template('user/login.html')

        session['login_username'] = username
        g.login_username = username

        # Check if someone isn't trying to sneak past OIDC login.
        if should_redirect_to_oidc(username):
            return redirect(oidc_authorize_url(username))

        if password == '':
            flash('Password missing', 'danger')
            return render_template('user/login.html')

        try:
            irods_login(username, password)

        except PAM_AUTH_PASSWORD_FAILED:
            flash('Username/password was incorrect', 'danger')
            log_error("iRODS authentication failed for user " + username)
            return render_template('user/login.html')

        except iRODSException:
            flash(
                'An error occurred while connecting to iRODS. '
                'If the issue persists, please contact the '
                'system administrator',
                'danger')

            log_error("iRODSException for login of user " + str(username), True)
            return render_template('user/login.html')

        except Exception:
            flash(
                'An error occurred while connecting to iRODS. '
                'If the issue persists, please contact the '
                'system administrator',
                'danger')
            log_error("Unexpected exception for login of user " + str(username), True)
            return render_template('user/login.html')

        return redirect(original_destination())

    if session.get('login_username') is None:
        return redirect(url_for('user_bp.gate'))

    return render_template('user/login.html')


@user_bp.route('/logout')
def logout() -> Response:
    """Logout user and redirect to index."""
    connman.clean(session.sid)
    session.clear()
    return redirect(url_for('general_bp.index'))


@user_bp.route('/notifications')
def notifications() -> Response:
    """Notifications page."""
    sort_order = request.args.get('sort_order', 'desc')
    response = api.call('notifications_load', data={'sort_order': sort_order})
    session['notifications'] = len(response['data'])
    return render_template('user/notifications.html', notifications=response['data'])


@user_bp.route('/settings', methods=['GET', 'POST'])
def settings() -> Response:
    """User settings page."""
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
            flash('Saving settings failed!', 'danger')

    # Load user settings.
    response = api.call('settings_load', data={})
    settings = response['data']

    return render_template('user/settings.html', **settings)


@user_bp.route('/data_access')
def data_access() -> Response:
    """Data Access Passwords overview"""
    response = api.call('token_load')
    token_lifetime = app.config.get('TOKEN_LIFETIME')
    return render_template('user/data_access.html',
                           tokens=response['data'],
                           token_lifetime=token_lifetime)


@user_bp.route('/callback')
def callback() -> Response:
    """OpenID Connect callback."""
    def token_request() -> requests.Response:
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

    def userinfo_request(token: str) -> requests.Response:
        userinfo_uri = app.config.get('OIDC_USERINFO_URI')
        response = requests.get(
            userinfo_uri,
            headers={
                'Authorization': f'Bearer {token}'
            }
        )

        return response

    class UserinfoSubMismatchError(Exception):
        pass

    class UserinfoEmailMismatchError(Exception):
        pass

    token_response = None
    userinfo_response = None
    exception_occurred = "OPENID_ERROR"  # To identify exception in finally-clause

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
        userinfo_payload = userinfo_response.json()

        # Check if payload subject matches with user info subject.
        if payload['sub'] != userinfo_payload['sub']:
            raise UserinfoSubMismatchError

        # Check if login email matches with user info email.
        email_identifier = app.config.get('OIDC_EMAIL_FIELD')
        email = g.login_username.lower()

        userinfo_email = userinfo_payload[email_identifier]
        if not isinstance(userinfo_email, list):
            userinfo_email = [userinfo_email]
        userinfo_email = [x.lower() for x in userinfo_email]

        if email not in userinfo_email:
            raise UserinfoEmailMismatchError

        # Add a prefix to consume in the PAM stack
        access_token = '++oidc_token++' + payload['sub'] + 'end_sub' + access_token

        try:
            irods_login(email, access_token)
        except CAT_INVALID_USER:
            log_error(f"iRODS invalid user {email}", True)
            exception_occurred = "CAT_INVALID_USER_ERROR"
        except CAT_INVALID_AUTHENTICATION:
            log_error(f"RODS invalid authentication for user {email}", True)
            exception_occurred = "CAT_INVALID_AUTHENTICATION"
        else:
            # No errors in entire process, clear the exception_occurred flag.
            exception_occurred = ""

    except jwt.PyJWTError:
        # Error occurred during steps for verification,
        # configurations used can be found in flask.cfg
        log_error("PyJWTError during callback for token " + str(id_token), True)

    except json.decoder.JSONDecodeError:
        # Either token response or userinfo response decoding failed
        log_error('JSON decode error during callback.', True)

        if token_response is not None:
            log_error(
                f'token_response + headers:\n{token_response.headers}\n\n{token_response.text}'
            )

        if userinfo_response is not None:
            log_error(
                f'userinfo_response + headers:\n{userinfo_response.headers}\n\n{userinfo_response.text}'
            )

    except iRODSException:
        log_error(f'iRODSException for user {email} during callback', True)

    except KeyError:
        # Missing key in token or userinfo response.
        # The only one of interest is the latest response.
        if userinfo_response is not None:
            log_error(
                f'KeyError in callback for userinfo_response + headers:'
                f'\n{userinfo_response.headers}\n{userinfo_response.text}',
                True
            )
        elif token_response is not None:
            log_error(
                f'KeyError in callback for token_response + headers:\n{token_response.headers}\n{token_response.text}',
                True
            )

    except UserinfoSubMismatchError:
        # Possible Token substitution attack.
        log_error(
            f"Possible token substitution attack: {payload['sub']} is not {userinfo_payload['sub']}",
            True
        )

    except UserinfoEmailMismatchError:
        # Mismatch between email and user info email.
        log_error(
            f'Mismatch between email and user info email: {email} is not in {userinfo_email}',
            True
        )

    except Exception:
        log_error(f"Unexpected exception during callback for username {email}", True)

    finally:
        if exception_occurred == "CAT_INVALID_USER_ERROR" or exception_occurred == "CAT_INVALID_AUTHENTICATION":
            flash('Username/password was incorrect', 'danger')
        elif exception_occurred == "OPENID_ERROR":
            flash(
                'An error occurred during the OpenID Connect protocol. '
                'If the issue persists, please contact the system '
                'administrator',
                'danger'
            )

        # Redirect to gate when exception has occured.
        if exception_occurred:
            return redirect(url_for('user_bp.gate'))

    return redirect(original_destination())


def should_redirect_to_oidc(username: str) -> bool:
    """Check if user should be redirected to OIDC based on domain."""
    if '@' in username:
        domains: List[str] = app.config.get('OIDC_DOMAINS')
        user_domain = username.split('@')[1]
        if app.config.get('OIDC_ENABLED') and user_domain in domains:
            return True

    return False


def oidc_authorize_url(username: str) -> str:
    authorize_url: str = app.config.get('OIDC_AUTH_URI')

    if app.config.get('OIDC_LOGIN_HINT') and username:
        authorize_url += '&login_hint=' + username

    return authorize_url


def irods_login(username: str, password: str) -> None:
    """Start session with iRODS."""
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

    session['user_id'] = username
    session['password'] = password
    connman.add(session.sid, irods)


def original_destination() -> str:
    target = session.get('redirect_target')
    if target is not None:
        session['redirect_target'] = None
        return target
    else:
        return url_for('general_bp.index')


@user_bp.before_app_request
def prepare_user() -> None:
    user_id = session.get('user_id', None)
    irods = connman.get(session.sid)
    login_username = session.get('login_username')

    if login_username:
        g.login_username = login_username

    if user_id is None:
        g.user = None
    elif irods is not None:
        g.user = user_id
        g.irods = irods

        # Check for notifications.
        endpoints = ["static", "call", "upload_get", "upload_post"]
        if request.endpoint is not None and not request.endpoint.endswith(tuple(endpoints)):
            response = api.call('notifications_load', data={})
            g.notifications = len(response['data'])
    else:
        redirect('user_bp.login')


@user_bp.after_app_request
def release_session(response: Response) -> Response:
    connman.release(session.sid)
    return response
