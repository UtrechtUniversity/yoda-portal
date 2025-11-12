#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__ = 'GPLv3, see LICENSE'

import csv
import io
import urllib.parse
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
    url_for,
)
from irods.data_object import iRODSDataObject
from irods.exception import CAT_NO_ACCESS_PERMISSION

import api
import connman
from cache_config import cache_view

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
@cache_view()
def index() -> Response:
    """Deposit overview"""
    return render_template('deposit/overview.html',
                           activeModule='deposit')


@deposit_bp.route('/data')
def data() -> Response:
    """Step 1: Add data"""
    path = request.args.get('dir', None)
    group = request.args.get('group', None)
    if group:
        try:
            response = api.call('deposit_create', data={'deposit_group': group})
            path = "/" + response['data']['deposit_path']
            path = path.replace('//', '/')
        except Exception:
            abort(403)

        return render_template('deposit/data.html',
                               activeModule='deposit',
                               path=path)
    elif path:
        return render_template('deposit/data.html',
                               activeModule='deposit',
                               path=path)
    else:
        try:
            response = api.call('deposit_create', data={})
            path = "/" + response['data']['deposit_path']
            path = path.replace('//', '/')
        except Exception:
            abort(403)

        return render_template('deposit/data.html',
                               activeModule='deposit',
                               path=path)


@deposit_bp.route('/browse/download')
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


@deposit_bp.route('/browse/download_checksum_report')
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
@cache_view()
def thankyou() -> Response:
    """Step 4: Thank you"""
    return render_template('deposit/thank-you.html')
