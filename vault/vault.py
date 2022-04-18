#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import io
from typing import Iterator
from uuid import UUID

from flask import abort, Blueprint, g, render_template, request, Response, stream_with_context

import api

vault_bp = Blueprint('vault_bp', __name__,
                     template_folder='templates',
                     static_folder='static/vault',
                     static_url_path='/assets')


@vault_bp.route('/')
@vault_bp.route('/browse')
def index() -> Response:
    items = 10
    dir = request.args.get('dir')

    if dir is None:
        dir = ''

    return render_template('vault/browse.html',
                           activeModule='vault',
                           items=items,
                           dir=dir)


@vault_bp.route('/browse/download')
def download() -> Response:
    path = '/' + g.irods.zone + '/home' + request.args.get('filepath')
    filename = path.rsplit('/', 1)[1]
    session = g.irods

    READ_BUFFER_SIZE = 1024 * io.DEFAULT_BUFFER_SIZE

    def read_file_chunks(path: str) -> Iterator[bytes]:
        obj = session.data_objects.get(path)
        with obj.open('r') as fd:
            while True:
                buf = fd.read(READ_BUFFER_SIZE)
                if buf:
                    yield buf
                else:
                    break

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


@vault_bp.route('/metadata/form')
def form() -> Response:
    path = request.args.get('path')

    return render_template('vault/metadata-form.html', path=path)


@vault_bp.route('/access', methods=['POST'])
def access() -> Response:
    path = request.form.get('path')
    action = request.form.get('action')

    full_path = '/' + g.irods.zone + '/home' + path

    if action == 'grant':
        response = api.call('grant_read_access_research_group', {"coll": full_path})
    else:
        response = api.call('revoke_read_access_research_group', {"coll": full_path})

    return response


@vault_bp.route('/yoda/<reference>')
def metadata(reference: str) -> Response:
    # Check if Data Package Reference is a valid UUID4.
    try:
        if UUID(reference).version != 4:
            abort(404)
    except ValueError:
        abort(404)

    dir = ''
    # Find data package with provided reference.
    response = api.call('vault_get_package_by_reference',
                        {"reference": reference})

    dp_is_restricted = True
    if response['status'] == 'ok':
        dir = response['data']
        dp_is_restricted = False

    return render_template('vault/datapackage.html',
                           activeModule='vault',
                           dir=dir,
                           reference=reference,
                           dp_is_restricted=dp_is_restricted)
