#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2026, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import csv
import io
import urllib
from typing import Iterator

from flask import (
    abort,
    Blueprint,
    g,
    redirect,
    render_template,
    request,
    Response,
    session,
    stream_with_context,
    url_for
)
from flask_wtf.csrf import CSRFError
from irods.data_object import iRODSDataObject
from irods.exception import CAT_NO_ACCESS_PERMISSION

import api
import connman
from cache_config import cache_view
from util import log_error

general_bp = Blueprint('general_bp', __name__,
                       template_folder='templates/general',
                       static_folder='static/general',
                       static_url_path='/assets')


@general_bp.route('/')
@cache_view()
def index() -> Response:
    return render_template('index.html')


@general_bp.app_errorhandler(CSRFError)
def csrf_error(e: Exception) -> Response:
    username = session.get("login_username", "N/A")
    log_error(f"CSRF error occurred for user {username} on path {request.path}.")
    return redirect(url_for('user_bp.login'))


@general_bp.app_errorhandler(403)
def access_forbidden(e: Exception) -> Response:
    return render_template('403.html'), 403


@general_bp.app_errorhandler(404)
def page_not_found(e: Exception) -> Response:
    return render_template('404.html'), 404


@general_bp.app_errorhandler(500)
def internal_error(e: Exception) -> Response:
    return render_template('500.html'), 500


@general_bp.route('/browse/download')
def download() -> Response:
    filepath = request.args.get('filepath')
    if not filepath:
        abort(404)

    path = f"/{g.irods.zone}/home{filepath}"
    filename = path.rsplit('/', 1)[1]
    quoted_filename = urllib.parse.quote(filename, safe='')

    def read_file_chunks(data_object: iRODSDataObject) -> Iterator[bytes]:
        READ_BUFFER_SIZE = 1024 * io.DEFAULT_BUFFER_SIZE

        try:
            with data_object.open('r') as fd:
                while True:
                    buf = fd.read(READ_BUFFER_SIZE)
                    if not buf:
                        break
                    connman.extend(session.sid)
                    yield buf
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
                'Content-Disposition': f"attachment; filename*=UTF-8''{quoted_filename}",
                'Content-Length': f'{size}',
                'Content-Type': 'application/octet-stream'
            }
        )
    else:
        abort(404)


@general_bp.route('/browse/download_checksum_report')
def download_checksum_report() -> Response:
    path = request.args.get('path')
    if not path:
        abort(404)

    format = request.args.get("format")
    coll = f"/{g.irods.zone}/home{path}"
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
