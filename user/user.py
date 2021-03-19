#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import ssl

from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for
from irods.session import iRODSSession

import api
import connman

ssl_context = ssl.create_default_context(purpose=ssl.Purpose.SERVER_AUTH, cafile=None, capath=None, cadata=None)
ssl_settings = {'ssl_context': ssl_context}

user_bp = Blueprint('user_bp', __name__,
                    template_folder='templates/user',
                    static_folder='static/user')


@user_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # s = (#connman.get(request.form['username'], request.form['password'])
        username = request.form['username']
        password = request.form['password']
        error = None

        if username is None:
            error = 'Missing username'
        else:
            try:
                irods = iRODSSession.__enter__(
                    iRODSSession(
                        host='localhost',
                        port=1247,
                        user=username,
                        password=password,
                        zone='tempZone',
                        configure=True,
                        **ssl_settings))
                _ = irods.server_version

            except Exception as e:
                error = 'Login failed: {}'.format(e)

            connman.add(session.sid, irods)

        if error is None:
            session.clear()
            session['user_id'] = username
            session['password'] = password
            return redirect(url_for('general_bp.index'))

        flash(error)

    return render_template('login.html')


@user_bp.route('/logout')
def logout():
    connman.clean(session.sid)
    session.clear()
    return redirect(url_for('general_bp.index'))


@user_bp.route('/forgot-password')
def forgot_password():
    return render_template('login.html')


@user_bp.route('/settings', methods=['GET', 'POST'])
def settings():
    if request.method == 'POST':
        flash("Settings saved successfully")

    response = api.call('settings_load', data={})
    response_dict = response.get_json()
    settings = {}
    if response_dict['status'] == 'ok':
        settings = response_dict['data']

    return render_template('settings.html')


@user_bp.before_app_request
def prepare_user():
    user_id = session.get('user_id', None)
    irods = connman.get(session.sid)

    if user_id is None:
        g.user = None
    elif irods is not None:
        g.user = user_id
        g.irods = irods
    else:
        redirect('user_bp.login')


@user_bp.after_app_request
def release_session(response):
    connman.release(session.sid)
    return response
