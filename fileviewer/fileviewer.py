#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2024-2026, Utrecht University'
__license__   = 'GPLv3, see LICENSE'


from flask import (
    Blueprint,
    render_template,
    request,
    Response,
)


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
