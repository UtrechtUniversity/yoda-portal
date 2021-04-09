#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from flask import Blueprint, render_template, request, session, current_app

research_bp = Blueprint('research_bp', __name__,
                        template_folder='templates',
                        static_folder='static/research',
                        static_url_path='/static')

@research_bp.route('')
def index():
    #items = config['browser-items-per-page']
    items = 10
    dir = request.args.get('dir')

    if dir == None:
        dir = ''

    # Search results data
    searchTerm = ''
    searchStatusValue = ''
    searchType = 'filename'
    searchStart = 0
    searchOrderDir = 'asc'
    searchOrderColumn = 0
    #searchItemsPerPage = config['search-items-per-page']
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
            dir=dir
            )


@research_bp.route('/download')
def download():
    path_start = current_app.config['app_path_start']
    filepath = path_start + request.args.get('filepath')

    response = api.call('get_content', data={'path': file_path})

    output = make_response(response['data']['content'])

    output.headers['Content-Disposition'] = 'attachment; filename="{}"'.format(request.args.get('filepath'))
    output.headers['Content-Type'] = 'application/octet'
    output.headers['Content-Length'] = response['data']['size']

    return output


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


@research_bp.route('/search/unset_session')
def unset_session():
    session.pop('research-search-term', None)
    session.pop('research-search-start', None)
    session.pop('research-search-type', None)
    session.pop('research-search-order-dir', None)
    session.pop('research-search-order-column', None)
    session.pop('research-search-status-value', None)
