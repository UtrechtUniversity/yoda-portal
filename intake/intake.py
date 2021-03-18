#!/usr/bin/env python3
from flask import Blueprint, render_template

intake_bp = Blueprint('intake_bp', __name__,
                     template_folder='templates/intake',
                     static_folder='static/intake')


@intake_bp.route('/example')
def index():
    return render_template('example.html')
