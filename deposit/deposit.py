#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__ = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template

import api

deposit_bp = Blueprint('deposit_bp', __name__,
                       template_folder='templates',
                       static_folder='static/deposit',
                       static_url_path='/deposit')

"""
Deposit flow:
    Uses the flow upload in research module

    1. Upload data:     /deposit
    2. Add metadata:    /deposit/metadata/
    3. Submit:          /deposit/submit
"""


def get_deposit_path():
    response = api.call('deposit_path')
    path = "/" + response['data']['deposit_path']
    return path.replace('//', '/')


@deposit_bp.route('/', methods=['GET'])
def index():
    """ Step 1: Deposit files and folders """
    path = get_deposit_path()
    return render_template('deposit/deposit.html', path=path)


@deposit_bp.route('/metadata')
@deposit_bp.route('/metadata/form')
def metadata_form():
    """Step 2: Add metadata to your upload"""
    path = get_deposit_path()
    return render_template('deposit/metadata-form.html', path=path)


@deposit_bp.route('/submit', methods=['GET'])
def submit():
    """Step 3: Submit upload"""
    path = get_deposit_path()
    return render_template('deposit/submit.html', path=path)


@deposit_bp.route('/submit', methods=['POST'])
def submit_upload():
    """Step 3: Submit upload """
    # todo upload here with agreeing terms and conditions
    return render_template('deposit/thankyou.html')
