#!/usr/bin/env python3
from flask import Blueprint, render_template, redirect, url_for

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__ = 'GPLv3, see LICENSE'

deposit_bp = Blueprint('deposit_bp', __name__,
                       template_folder='templates/deposit',
                       static_folder='static/deposit',
                       static_url_path='/deposit')


"""
Deposit flow:
1. upload data:     /deposit/
2. add metadata:    /deposit/metadata/
3. submit:          /deposit/submit/
"""


@deposit_bp.route('/', methods=['GET'])
def index():
    return render_template('deposit.html')


@deposit_bp.route('/', methods=['POST'])
def upload():
    """ POST to this url to upload your deposit """
    return redirect(url_for('deposit_bp.metadata'))


@deposit_bp.route('/metadata', methods=['GET'])
def metadata():
    return render_template('metadata.html')


@deposit_bp.route('/metadata', methods=['POST'])
def metadata_upload():
    """ Step2: Add metadata to your upload """
    return redirect(url_for('deposit_bp.submit'))


@deposit_bp.route('/submit', methods=['GET'])
def submit():
    """ Step 3: Submit upload """
    return render_template('submit.html')


@deposit_bp.route('/submit', methods=['POST'])
def submit_handler():
    """ Step 3: Submit upload """
    return render_template('thankyou.html')
