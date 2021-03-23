#!/usr/bin/env python3
import vault
import json

# from flask import Blueprint, render_template ??

# import api ??

# ??????????????????????
# $this->data['userIsAllowed'] = TRUE;


@vault_bp.route('/index', methods=['GET'])
def index():
    items = app.config['browser-items-per-page']
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
    searchItemsPerPage = app.config['search-items-per-page']

    if 'research-search-term' in session or 'research-search-status-value' in session:
	    if 'research-search-term' in session:
		    searchTerm = reseach['research-search-term']
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
    searchHtml = render_template('search.html', 
        searchTerm=searchTerm, 
        searchStatusValue=searchStatusValue, 
        searchType=searchType, 
        searchStart=searchStart, 
        searchOrderDir=searchOrderDir, 
        searchOrderColumn=searchOrderColumn, 
        showStatus=showStatus, 
        showTerm=showTerm, 
        searchItemsPerPage=searchItemsPerPage)

    return render_template('browse.html', 
            activeModule='vault',
            searchHtml=searchHtml,
            items=items,
            dir=dir
            )

@vault_bo.route('/download', methods=['GET'])
def download():
    path_start = app.config['path_start']
    filepath = path_start + request.args.get('filepath')

############ 
@app.route('/uploads/<path:filename>', methods=['GET', 'POST'])
def download(filename):
    # Appending app path to upload folder path within app root folder
    uploads = os.path.join(current_app.root_path, app.config['UPLOAD_FOLDER'])

    # Returning file from appended path
    return send_from_directory(directory=uploads, filename=filename)
