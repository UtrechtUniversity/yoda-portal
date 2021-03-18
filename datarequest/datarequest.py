#!/usr/bin/env python3
from flask import Blueprint, render_template

datarequest_bp = Blueprint('datarequest_bp', __name__,
                     template_folder='templates/datarequest',
                     static_folder='static/datarequest')


@datarequest_bp.route('/example')
def index():
    return render_template('example.html')
