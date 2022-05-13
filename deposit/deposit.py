#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__ = 'GPLv3, see LICENSE'

import io
import os
from typing import Iterator

from flask import abort, Blueprint, g, redirect, render_template, request, Response, url_for, stream_with_context
from irods.exception import CAT_NO_ACCESS_PERMISSION
from irods.message import iRODSMessage
from werkzeug.utils import secure_filename

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
                           path=path)


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
                           path=path)


@deposit_bp.route('/browse/download')
def download() -> Response:
    path = '/' + g.irods.zone + '/home' + request.args.get('filepath')
    filename = path.rsplit('/', 1)[1]
    session = g.irods

    READ_BUFFER_SIZE = 1024 * io.DEFAULT_BUFFER_SIZE

    def read_file_chunks(path: str) -> Iterator[bytes]:
        obj = session.data_objects.get(path)
        try:
            with obj.open('r') as fd:
                while True:
                    buf = fd.read(READ_BUFFER_SIZE)
                    if buf:
                        yield buf
                    else:
                        break
        except CAT_NO_ACCESS_PERMISSION:
            abort(403)
        except Exception:
            abort(500)

    if session.data_objects.exists(path):
        return Response(
            stream_with_context(read_file_chunks(path)),
            headers={
                'Content-Disposition': f'attachment; filename={filename}',
                'Content-Type': 'application/octet'
            }
        )
    else:
        abort(404)


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
