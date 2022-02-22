#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template, request

open_search_bp = Blueprint('open_search_bp', __name__,
                           template_folder='templates',
                           static_folder='static/open_search',
                           static_url_path='/assets')


@open_search_bp.route('/')
def index():
    searchTerm = request.args.get('q', None)

    if searchTerm is None:
        searchTerm = ''

    return render_template('open_search/search.html',
                           searchTerm=searchTerm)
