#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import io
import queue
import threading
import urllib.parse
from typing import Iterator

from flask import (
    abort, Blueprint, g,
    render_template, request, Response, session, stream_with_context
)
from irods.data_object import iRODSDataObject
from irods.exception import CAT_NO_ACCESS_PERMISSION

import connman
from util import log_error

fileviewer_bp = Blueprint('fileviewer_bp', __name__,
                          template_folder='templates',
                          static_folder='static/fileviewer',
                          static_url_path='/assets')


class Chunk:
    def __init__(self, data_objects, path, number, size, data, resource):
        self.data_objects = data_objects
        self.path = path
        self.number = number
        self.size = size
        self.data = data
        self.resource = resource


q = queue.Queue(4)
r = queue.Queue(1)


def irods_writer() -> None:
    failure = False
    while True:
        chunk = q.get()
        if chunk.path:
            if not failure:
                try:
                    with chunk.data_objects.open(chunk.path, 'a', chunk.resource) as obj_desc:
                        obj_desc.seek(int(chunk.size * (chunk.number - 1)))
                        obj_desc.write(chunk.data)
                except Exception:
                    failure = True
                    log_error("Chunk upload failed for {}".format(chunk.path))
                finally:
                    try:
                        obj_desc.close()
                    except Exception:
                        pass
        else:
            # report back about failures
            r.put(failure)
            failure = False
        q.task_done()


threading.Thread(target=irods_writer, name='irods-writer', daemon=True).start()


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
