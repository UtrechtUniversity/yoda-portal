#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import io
import urllib.parse
from typing import Iterator

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

import connman

fileviewer_bp = Blueprint('fileviewer_bp', __name__,
                          template_folder='templates',
                          static_folder='static/fileviewer',
                          static_url_path='/assets')


@fileviewer_bp.route('/')
@fileviewer_bp.route('')
def index() -> Response:
    file = request.args.get('file')
    if file is None:
        file = '/'

    return render_template('fileviewer/file.html', file=file)


@fileviewer_bp.route('/browse/download')
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
