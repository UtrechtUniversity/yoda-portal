#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import csv
import io
import urllib.parse
from typing import Iterator
from uuid import UUID

from flask import (
    abort,
    Blueprint,
    g,
    render_template,
    request,
    Response,
    session,
    stream_with_context,
)
from irods.data_object import iRODSDataObject
from irods.exception import CAT_NO_ACCESS_PERMISSION

import api
import connman
from cache_config import cache_view

vault_bp = Blueprint('vault_bp', __name__,
                     template_folder='templates',
                     static_folder='static/vault',
                     static_url_path='/assets')


@vault_bp.route('/')
@vault_bp.route('/browse')
@cache_view()
def index() -> Response:
    return render_template('vault/browse.html')


@vault_bp.route('/browse/download')
def download() -> Response:
    path = '/' + g.irods.zone + '/home' + request.args.get('filepath')
    filename = path.rsplit('/', 1)[1]
    quoted_filename = urllib.parse.quote(filename)

    def read_file_chunks(data_object: iRODSDataObject) -> Iterator[bytes]:
        READ_BUFFER_SIZE = 1024 * io.DEFAULT_BUFFER_SIZE

        try:
            with data_object.open('r') as fd:
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
        data_object = g.irods.data_objects.get(path)
        size = data_object.replicas[0].size

        return Response(
            stream_with_context(read_file_chunks(data_object)),
            headers={
                'Content-Disposition': "attachment; filename*=UTF-8''" + quoted_filename,
                'Content-Length': f'{size}',
                'Content-Type': 'application/octet-stream'
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
    path = request.args.get("path")
    format = request.args.get("format")
    coll = "/" + g.irods.zone + "/home" + path
    response = api.call('research_manifest', data={'coll': coll})

    if format == 'csv':
        mime = 'text/csv'
        ext = '.csv'
        output_io = io.StringIO()
        writer = csv.writer(output_io, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(["filename", "size", "checksum"])
        if response['status'] == 'ok':
            for result in response["data"]["manifest"]:
                writer.writerow([result['name'], result['human_readable_size'], result['checksum']])
        output = output_io.getvalue()
    else:
        mime = 'text/plain'
        ext = '.txt'
        lines = []
        if response['status'] == 'ok':
            for result in response["data"]["manifest"]:
                lines.append(f"{result['name']} {result['human_readable_size']} {result['checksum']}")
        output = "\n".join(lines)

    return Response(
        output,
        mimetype=mime,
        headers={'Content-disposition': 'attachment; filename=checksums' + ext}
    )
