#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template

group_bp = Blueprint('group_bp', __name__,
                     template_folder='templates',
                     static_folder='static/group_manager')


@group_bp.route('/example')
def index():
    return render_template('group_manager/example.html')
