#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__ = 'GPLv3, see LICENSE'

import os

from flask import Blueprint, g, jsonify, make_response, render_template, request

deposit_bp = Blueprint('deposit_bp', __name__,
                       template_folder='templates',
                       static_folder='static/deposit',
                       static_url_path='/deposit')


"""
Deposit flow:
1. Upload data:     /deposit
2. Add metadata:    /deposit/metadata/form?path=/research-initial
3. Submit:          /deposit/submit

Flow upload: 
Uses the flow upload in research module
"""


@deposit_bp.route('/', methods=['GET'])
def index():
    return render_template('deposit/deposit.html')


@deposit_bp.route('/metadata/form')
def metadata_form():
    """ Step2: Add metadata to your upload """
    path = request.args.get('path')
    return render_template('deposit/metadata-form.html', path=path)


@deposit_bp.route('/submit', methods=['GET'])
def submit():
    """ Step 3: Submit upload """
    return render_template('deposit/submit.html')


@deposit_bp.route('/submit', methods=['POST'])
def submit_upload():
    """ Step 3: Submit upload """
    # todo upload with POST here or with metadata form
    return render_template('deposit/thankyou.html')
