#!/usr/bin/env python3
from flask import Blueprint, render_template

research_bp = Blueprint('research_bp', __name__,
                        template_folder='templates/research',
                        static_folder='static/research')


@research_bp.route('/example')
def index():
    return render_template('example.html')
