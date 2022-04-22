#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__ = 'GPLv3, see LICENSE'

from flask import abort, Blueprint, redirect, render_template, request, Response, url_for

import api

deposit_bp = Blueprint('deposit_bp', __name__,
                       template_folder='templates',
                       static_folder='static/deposit',
                       static_url_path='/assets')

"""
    0. Deposit overview: /deposit/
    1. Add data:         /deposit/data/
    2. Document data:    /deposit/metadata/
    3. Submit data:      /deposit/submit/
    4. Thank you:        /deposit/thankyou/
"""


@deposit_bp.route('/')
@deposit_bp.route('/browse')
def index() -> Response:
    """Deposit overview"""
    path = "/deposit-pilot"
    return render_template('deposit/overview.html',
                           activeModule='deposit',
                           items=25,
                           dir=path)


@deposit_bp.route('/data')
def data() -> Response:
    """Step 1: Add data"""
    path = request.args.get('dir', None)
    if path is None:
        try:
            response = api.call('deposit_create')
            path = "/" + response['data']['deposit_path']
            path = path.replace('//', '/')
        except Exception:
            abort(403)

    return render_template('deposit/data.html',
                           activeModule='deposit',
                           items=25,
                           dir=path,
                           path=path)


@deposit_bp.route('/metadata')
def metadata() -> Response:
    """Step 2: Document data"""
    path = request.args.get('dir', None)
    if path is None:
        return redirect(url_for('deposit_bp.index'))
    return render_template('deposit/metadata-form.html', path=path)


@deposit_bp.route('/submit')
def submit() -> Response:
    """Step 3: Submit data"""
    path = request.args.get('dir', None)
    if path is None:
        return redirect(url_for('deposit_bp.index'))
    return render_template('deposit/submit.html', path=path)


@deposit_bp.route('/thank-you')
def thankyou() -> Response:
    """Step 4: Thank you"""
    return render_template('deposit/thank-you.html')
