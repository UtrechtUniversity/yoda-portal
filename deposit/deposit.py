#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'


from flask import Blueprint, g, make_response, render_template, request, session

deposit_bp = Blueprint('deposit_bp', __name__,
                      template_folder='templates/deposit/',
                      static_folder='static/deposit',
                      static_url_path='/deposit')


@deposit_bp.route('/', methods=['GET'])
def index():
    return render_template('deposit.html')