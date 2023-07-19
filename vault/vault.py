#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2023, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import io
from typing import Iterator
from uuid import UUID

from flask import abort, Blueprint, g, render_template, request, Response, session, stream_with_context
from irods.exception import CAT_NO_ACCESS_PERMISSION

import api
import connman

vault_bp = Blueprint('vault_bp', __name__,
                     template_folder='templates',
                     static_folder='static/vault',
                     static_url_path='/assets')


@vault_bp.route('/')
@vault_bp.route('/browse')
def index() -> Response:
    dir = request.args.get('dir')

    if dir is None:
        dir = ''

    return render_template('vault/browse.html',
                           activeModule='vault',
                           dir=dir)


@vault_bp.route('/browse/download')
def download() -> Response:
    path = '/' + g.irods.zone + '/home' + request.args.get('filepath')
    filename = path.rsplit('/', 1)[1]
    READ_BUFFER_SIZE = 1024 * io.DEFAULT_BUFFER_SIZE

    def read_file_chunks(path: str) -> Iterator[bytes]:
        obj = g.irods.data_objects.get(path)
        try:
            with obj.open('r') as fd:
                while True:
                    buf = fd.read(READ_BUFFER_SIZE)
                    if buf:
                        connman.extend(session.sid)
                        yield buf
                    else:
                        break
        except CAT_NO_ACCESS_PERMISSION:
            abort(403)
        except Exception:
            abort(500)

    if g.irods.data_objects.exists(path):
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


@vault_bp.route('/browse/download_checksum_report')
def download_report() -> Response:
    output = ""
    path = request.args.get("path")
    format = request.args.get("format")
    coll = "/" + g.irods.zone + "/home" + path
    response = api.call('research_manifest', data={'coll': coll})

    if format == 'csv':
        mime = 'text/csv'
        ext = '.csv'
        if response['status'] == 'ok':
            for result in response["data"]:
                output += f"{result['name']},{result['checksum']} \n"
    else:
        mime = 'text/plain'
        ext = '.txt'
        if response['status'] == 'ok':
            for result in response["data"]:
                output += f"{result['name']} {result['checksum']} \n"

    return Response(
        output,
        mimetype=mime,
        headers={'Content-disposition': 'attachment; filename=checksums' + ext}
    )
