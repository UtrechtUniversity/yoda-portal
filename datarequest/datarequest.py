#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template, Response

datarequest_bp = Blueprint(
    'datarequest_bp',
    __name__,
    template_folder='templates'
)


@datarequest_bp.route('/example')
def index() -> Response:
    return render_template('datarequest/example.html')
