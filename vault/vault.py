#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'


from flask import Blueprint, make_response, render_template, request, session, current_app
from flask import g

import api


vault_bp = Blueprint('vault_bp', __name__,
                     template_folder='templates',
                     static_folder='static/vault',
                     static_url_path='/static')


@vault_bp.route('/', methods=['GET'])
def index():
    items = current_app.config['browser-items-per-page']
    dir = request.args.get('dir')

    # Hoe dit te vertalen??
    if dir == None:
        dir = ''

    # Search results data
    searchTerm = ''
    searchStatusValue = ''
    searchType = 'filename'
    searchStart = 0
    searchOrderDir = 'asc'
    searchOrderColumn = 0
    searchItemsPerPage = current_app.config['search-items-per-page']

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
    searchHtml = render_template('vault/search.html',
        searchTerm=searchTerm,
        searchStatusValue=searchStatusValue,
        searchType=searchType,
        searchStart=searchStart,
        searchOrderDir=searchOrderDir,
        searchOrderColumn=searchOrderColumn,
        showStatus=showStatus,
        showTerm=showTerm,
        searchItemsPerPage=searchItemsPerPage)

    return render_template('vault/browse.html',
            activeModule='vault',
            searchHtml=searchHtml,
            items=items,
            dir=dir
            )


@vault_bp.route('/browse/download', methods=['GET'])
def download():
    filepath =  '/' + g.irods.zone + '/home' + request.args.get('filepath')
    content = ''
    size = 0
    session = g.irods

    obj = session.data_objects.get(filepath)
    with obj.open('r') as f:
        content = f.read()
        # seek EOF to get file size
        f.seek(0, 2)
        size = f.tell()

    output = make_response(content)

    output.headers['Content-Disposition'] = 'attachment; filename="{}"'.format(request.args.get('filepath'))
    output.headers['Content-Type'] = 'application/octet'
    output.headers['Content-Length'] = size

    return output
 

@vault_bp.route('/metadata/form')
def form():
    try:
        path = request.args.get('path')
    except:
        # REDIRECT research/browse ???????
        return redirect(url_for('index'))

    path_start = '/' + g.irods.zone + '/home' # current_app.config['app_path_start']

    full_path = path_start + path

    print(full_path)

    # Flash message handling
    try:
        flashMessage = session['flashMessage']
        flashMessageType = session['flashMessageType']
    except KeyError:
        flashMessage = ''
        flashMessageType = ''

    formProperties = api.call('meta_form_load', {'coll': full_path})

    return render_template('vault/metadata-form.html',
        path=path,
        flashMessage=flashMessage,
        flashMessageType=flashMessageType,
        formProperties=formProperties)


@vault_bp.route('/search/unset_session')
def unset_session():
    session.pop('research-search-term', None)
    session.pop('research-search-start', None)
    session.pop('research-search-type', None)
    session.pop('research-search-order-dir', None)
    session.pop('research-search-order-column', None)
    session.pop('research-search-status-value', None)

    return 'OK' # Dummy response


@vault_bp.route('/search/set_session', methods=['POST'])
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

    return 'OK' # Dummy response


@vault_bp.route('/access')
def access():
    path = request.args.get('path')
    action = request.args.get('action')

    # full_path = configuration['app_path_start'] + path
    full_path = '/' + g.irods.zone + '/home/' + path

    if action == 'grant':
        response =  api.call('grant_read_access_research_group', {"coll": full_path})
    else:
        response =  api.call('revoke_read_access_research_group', {"coll": full_path})

    return jsonify(response)
