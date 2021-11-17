#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template, request, session

search_bp = Blueprint('search_bp', __name__,
                      template_folder='templates',
                      static_folder='static/search',
                      static_url_path='/assets')


@search_bp.route('/')
def index():
    items = 10
    dlgPageItems = 10
    filter = request.args.get('filter', None)

    view = 'browse'
    if filter is not None:
        view = 'revision'

    # Search results data
    searchTerm = ''
    searchStatusValue = ''
    searchType = 'filename'
    if filter is not None:
        searchType = 'revision'
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
                           view=view,
                           showStatus=showStatus,
                           showTerm=showTerm,
                           searchItemsPerPage=searchItemsPerPage,
                           items=items,
                           dlgPageItems=dlgPageItems,
                           filter=filter)


@search_bp.route('/set_session', methods=['POST'])
def set_session():
    value = request.args.get('value')
    type = request.args.get('type')

    if type == 'status':
        session['research-search-status-value'] = value
    else:
        session['research-search-term'] = value
        session.pop('research-search-status-value', None)

    session['research-search-type'] = type
    session['research-search-start'] = 0

    return 'OK'


@search_bp.route('/unset_session')
def unset_session():
    session.pop('research-search-term', None)
    session.pop('research-search-start', None)
    session.pop('research-search-type', None)
    session.pop('research-search-order-dir', None)
    session.pop('research-search-order-column', None)
    session.pop('research-search-status-value', None)

    return 'OK'
