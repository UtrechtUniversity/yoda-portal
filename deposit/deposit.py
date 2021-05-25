#!/usr/bin/env python3
from flask import Blueprint, render_template, redirect, url_for

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__ = 'GPLv3, see LICENSE'

deposit_bp = Blueprint('deposit_bp', __name__,
                       template_folder='templates/deposit',
                       static_folder='static/deposit',
                       static_url_path='/deposit')


"""
Deposit pages:
1. upload data
2. add metadata
3. submit
"""


@deposit_bp.route('/', methods=['GET'])
def index():
    return render_template('deposit.html')


@deposit_bp.route('/upload', methods=['POST'])
def upload():
    """ POST to this url to upload your deposit """
    # TODO
    # from werkzeug.utils import secure_filename
    # session = g.irods
    # filepath = request.form.get('filepath')
    # file_upload = request.files['file']
    # filename = secure_filename(file_upload.filename)
    # path = '/' + g.irods.zone + '/home' + filepath + "/" + filename
    return redirect(url_for('deposit_bp.metadata'))


@deposit_bp.route('/metadata', methods=['GET'])
def metadata():
    return render_template('metadata.html')


@deposit_bp.route('/metadata/upload', methods=['POST'])
def metadata_upload():
    """ Step2: Add metadata to your upload """
    return redirect(url_for('deposit_bp.submit'))


@deposit_bp.route('/submit', methods=['GET'])
def submit():
    """ Step 3: Submit upload """
    return render_template('submit.html')


@deposit_bp.route('/submit_handler', methods=['POST'])
def submit_handler():
    """ Step 3: Submit upload """
    return render_template('thankyou.html')
