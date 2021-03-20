#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template

stats_bp = Blueprint('stats_bp', __name__,
                     template_folder='templates/stats',
                     static_folder='static/stats')


@stats_bp.route('/')
def index():
    return render_template('stats.html')
