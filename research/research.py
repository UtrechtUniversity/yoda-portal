#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, g, make_response, render_template, request, session

import api

research_bp = Blueprint('research_bp', __name__,
                        template_folder='templates',
                        static_folder='static/research',
                        static_url_path='/static')


@research_bp.route('/')
@research_bp.route('/browse')
def index():
    items = 10
    dir = request.args.get('dir')

    if dir is None:
        dir = ''

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

        searchType = session['research-search-type']
        searchStart = session['research-search-start']
        searchOrderDir = session['research-search-order-dir']
        searchOrderColumn = session['research-search-order-column']

    showStatus = False
    showTerm = False
    if searchType == 'status':
        showStatus = True
    else:
        showTerm = True

    # Get the HTML for search part
    searchHtml = render_template('research/search.html',
                                 searchTerm=searchTerm,
                                 searchStatusValue=searchStatusValue,
                                 searchType=searchType,
                                 searchStart=searchStart,
                                 searchOrderDir=searchOrderDir,
                                 searchOrderColumn=searchOrderColumn,
                                 showStatus=showStatus,
                                 showTerm=showTerm,
                                 searchItemsPerPage=searchItemsPerPage)

    return render_template('research/browse.html',
                           activeModule='research',
                           searchHtml=searchHtml,
                           items=items,
                           dir=dir)


@research_bp.route('/download')
def download():
    path_start = '/' + g.irods.zone + '/home'
    file_path = path_start + request.args.get('filepath')

    response = api.call('get_content', data={'path': file_path})

    output = make_response(response['data']['content'])

    output.headers['Content-Disposition'] = 'attachment; filename="{}"'.format(request.args.get('filepath'))
    output.headers['Content-Type'] = 'application/octet'
    output.headers['Content-Length'] = response['data']['size']

    return output


@research_bp.route('/revision')
def revision():
    items = 10
    dlgPageItems = 10
    filter = request.args.get('filter')

    # Search results data
    searchTerm = filter
    searchStatusValue = ''
    searchType = 'revision'
    searchStart = 0
    searchOrderDir = 'asc'
    searchOrderColumn = 0
    searchItemsPerPage = 10
    showStatus = False
    showTerm = True

    # Get the HTML for search part
    searchHtml = render_template('research/search.html',
                                 searchTerm=searchTerm,
                                 searchStatusValue=searchStatusValue,
                                 searchType=searchType,
                                 searchStart=searchStart,
                                 searchOrderDir=searchOrderDir,
                                 searchOrderColumn=searchOrderColumn,
                                 showStatus=showStatus,
                                 showTerm=showTerm,
                                 searchItemsPerPage=searchItemsPerPage)

    return render_template('research/revision.html',
                           activeModule='research',
                           searchHtml=searchHtml,
                           items=items,
                           dlgPageItems=dlgPageItems,
                           filter=filter)


@research_bp.route('/metadata/form')
def form():
    path = request.args.get('path')

    return render_template('research/metadata-form.html', path=path)


@research_bp.route('/search/set_session', methods=['POST'])
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


@research_bp.route('/search/unset_session')
def unset_session():
    session.pop('research-search-term', None)
    session.pop('research-search-start', None)
    session.pop('research-search-type', None)
    session.pop('research-search-order-dir', None)
    session.pop('research-search-order-column', None)
    session.pop('research-search-status-value', None)

    return 'OK'
