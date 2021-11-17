#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template, session

search_bp = Blueprint('search_bp', __name__,
                      template_folder='templates',
                      static_folder='static/search',
                      static_url_path='/assets')


@search_bp.route('/')
def index():
    items = 10
    dlgPageItems = 10

    # Search results data
    searchTerm = ''
    searchStatusValue = ''
    searchType = 'filename'
    searchStart = 0
    searchOrderDir = 'asc'
    searchOrderColumn = 0
    searchItemsPerPage = 10

    if 'research-search-term' in session or 'research-search-status-value' in session:
        if 'research-search-term' in session:
            searchTerm = session['research-search-term']
        if 'research-search-status-value' in session:
            searchStatusValue = session['research-search-status-value']

        searchType = session.get('research-search-type', '')
        searchStart = session.get('research-search-start', '')
        searchOrderDir = session.get('research-search-order-dir', '')
        searchOrderColumn = session.get('research-search-order-column', '')

    showStatus = False
    showTerm = False
    if searchType == 'status':
        showStatus = True
    else:
        showTerm = True

    return render_template('search/search.html',
                           searchTerm=searchTerm,
                           searchStatusValue=searchStatusValue,
                           searchType=searchType,
                           searchStart=searchStart,
                           searchOrderDir=searchOrderDir,
                           searchOrderColumn=searchOrderColumn,
                           showStatus=showStatus,
                           showTerm=showTerm,
                           searchItemsPerPage=searchItemsPerPage,
                           items=items,
                           dlgPageItems=dlgPageItems,
                           filter=filter)
