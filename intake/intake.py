#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'


from flask import Blueprint, current_app, make_response, render_template, request, session
from flask import g

import api, time


intake_bp = Blueprint('intake_bp', __name__,
                     template_folder='templates',
                     static_folder='static/intake',
                     static_url_path='/intake')

@intake_bp.route('/', methods=['GET'])
def index():
    study_id = request.args.get('studyID')
    study_folder = request.args.get('studyFolder')
    alert_nr = request.args.get('alertNr')
    if alert_nr is None or len(alert_nr)==0:
        alert_nr = ''

    studies = api.call('intake_list_studies')['data']

    if study_id is None or len(study_id)==0:
        try:
            study_id = session['study_id']
        except Exception:
            # find a study from available studies.
            for study in studies:
                # Only take a study that is permitted
                temp_permissions = get_intake_study_permissions(study)
                if temp_permissions['manager'] or temp_permissions['assistant']:
                    study_id = study
                    break
            # If not default study can be found - NO ACCESS
            if study_id is None or len(study_id)==0:
                alert_nr = 100 # NO ACCESS

    # check whether user is part of the study-group.
    # if not, stop access
    permissions = get_intake_study_permissions(study_id)
    if not (permissions['manager'] or permissions['assistant']):
        alert_nr = 100 # NO ACCESS

    if alert_nr == 100:
        permissions = {}
        intake_path = ''
        valid_folders = []
        datasets = []
        total_dataset_files = 0
        data_erroneous_files = []
        total_file_count = 0
        study_folder = ''
        full_path = ''
        study_title = ''
    else: 
        # Store in current session for purpose when study_id is missing in requests
        session['study_id'] = study_id

        intake_path = '/' + g.irods.zone + '/home/grp-intake-' + study_id

        result = api.call('browse_collections', {'coll': intake_path,
                          'sort_on': 'name',
                          'sort_order': 'asc',
                          'offset': 0,
                          'limit': 10,
                          'space': 'Space.INTAKE'})

        valid_folders = result['data']['items']

        coll = intake_path
        if study_folder:
            coll += '/' + study_folder

        datasets = api.call('intake_list_datasets', {"coll": coll})['data']

        # get the total of dataset files
        total_dataset_files = 0
        for dataset in datasets:
            print('in dataset loop')
            total_dataset_files += dataset['objects']
            print(total_dataset_files)

        data_erroneous_files = api.call('intake_list_unrecognized_files', {"coll": coll})['data']

        total_file_count = api.call('intake_count_total_files', {"coll": coll})['data']

        study_title = study_id
        full_path = intake_path
        if study_folder:
            full_path += '/' + study_folder
            study_title += '/' + study_folder
        else:
            study_folder = ''

    return render_template('/intake/intake.html',
            activeModule='intake',
            permissions=permissions,
            studies=studies,
            intakePath=intake_path,
            alertNr=alert_nr,
            selectableScanFolders=valid_folders,
            dataSets=datasets,
            totalDatasetFiles=total_dataset_files,
            dataErroneousFiles=data_erroneous_files,
            totalErrorCount=len(data_erroneous_files),
            totalFileCount=total_file_count,
            study_id=study_id,
            study_folder=study_folder,
            full_path=full_path,
            title='Study ' + study_title)


def get_intake_study_permissions(study_id):
    return {'assistant': api.call('group_user_is_member', {'username': g.user, 'group_name': 'grp-intake-' + study_id})['data'],
            'manager': api.call('group_user_is_member', {'username': g.user, 'group_name': 'grp-datamanager-' + study_id})['data']}


@intake_bp.route('getDatasetDetailView', methods=['POST'])
def get_dataset_detail_view():
    study_id = request.form.get('studyID')
    path = request.form.get('path')
    tbl_id = request.form.get('tbl_id')  ## ???? Nog nodig in call - want vanuit javascript
    dataset_id = request.form.get('datasetID')

    intake_path = '/' + g.irods.zone + '/home/grp-' + study_id

    result = api.call('intake_dataset_get_details',
            {"coll": path, "dataset_id": dataset_id})

    path_items = result['data']['files']

    datasetErrors = result['data']['dataset_errors']
    datasetWarnings = result['data']['dataset_warnings']
    datasetComments = result['data']['comments']
    
    list_comments = []
    for comment in datasetComments:
        print(comment)
        parts = comment.split(':')
        list_comments.append({'name': parts[0],
                              'time': time.strftime('%Y/%m/%d %H:%M:%S', time.localtime(int(parts[1]))),
                              'comment': parts[2]})
    scan_data = result['data']['scanned'].split(':')
    scan_data[1] = time.strftime('%Y/%m/%d %H:%M:%S', time.localtime(int(scan_data[1])))

    table_definition = render_template('intake/dataset_detail_view.html',
        path_nodes_ordered=sorted(path_items.keys()),
        pathItems=path_items,
        tbl_id=tbl_id,
        datasetPath=path,
        scannedByWhen=scan_data,
        datasetErrors=datasetErrors,
        datasetWarnings=datasetWarnings,
        datasetComments=list_comments,
        datasetID=dataset_id)

    return {'output': table_definition,
            'hasError': False}


@intake_bp.route('download', methods=['GET'])
def export():
    # Datamanager only!
    study_id = request.args.get('studyID')

    permissions = get_intake_study_permissions(study_id)
    if not permissions['manager']:
        content = ''
        output = make_response(content)
        size = 0

        output.headers['Content-Disposition'] = 'attachment; filename="{}.csv"'.format('no_access_to_study')
        output.headers['Content-Type'] = 'application/octet'
        output.headers['Content-Length'] = size

        return output

    result = api.call('intake_report_export_study_data', {'study_id': study_id})

    export_data = result['data']

    content = '"Study",';
    content += '"Wave",';
    content += '"ExpType",';
    content += '"Pseudo",';
    content += '"Version",';
    content += '"ToVaultDay",';
    content += '"ToVaultMonth",';
    content += '"ToVaultYear",';
    content += '"DatasetSize",';
    content += '"DatasetFiles"';
    content += "\r\n";

    for data_row in export_data:
        data = export_data[data_row]
        content += "'" + study_id + "',"
        content += "'" +  data['wave']  + "',"
        content += "'" + data['experiment_type'] + "',"
        content += "'" + data['pseudocode'] + "',"
        content += "'" + data['version'] + "',"
        try:
            created = time.localtime(int(data['dataset_date_created']))
            content += "'" + time.strftime('%d', created) + "',"
            content += "'" + time.strftime('%m', created) + "',"
            content += "'" + time.strftime('%Y', created) + "',"
        except Exception:
            content += "'',"
            content += "'',"
            content += "'',"

        content += str(data['totalFileSize']) + "',"
        content += str(data['totalFiles']) + "',"
        content += "\r\n"

    output = make_response(content)
    size = len(content)

    output.headers['Content-Disposition'] = 'attachment; filename="{}.csv"'.format(study_id)
    output.headers['Content-Type'] = 'application/octet'
    output.headers['Content-Length'] = size

    return output


#     public function index($studyID=null)
@intake_bp.route('reports', methods=['GET'])
def reports(): 
    access_denied = True
    study_id = request.args.get('studyID')

    studies = api.call('intake_list_studies')['data']

    if study_id is None or len(study_id)==0:
        try:
            study_id = session['study_id']
        except Exception:
            # find a study from available studies.
            for study in studies:
                # Only take a study that is permitted
                temp_permissions = get_intake_study_permissions(study)
                if temp_permissions['manager']:
                    study_id = study
                    break
            # If not default study can be found - NO ACCESS
            #if study_id is None or len(study_id)==0:
            #    return 'NO ACCESS'

    # check whether user is part of the study-group.
    # if not, stop access
    permissions = get_intake_study_permissions(study_id)
    if permissions['manager']:
       access_denied = False

    intake_path = ''
    counts = {}
    aggregated_info = {}
    title_translate = {}

    if not access_denied:
        # Wat wordt hiermee gedaan dan??
        intake_path = '/' + g.irods.zone + '/home/grp-vault-' + study_id

        counts = api.call('intake_report_vault_dataset_counts_per_study', {'study_id': study_id})['data']

        aggregated_info = api.call('intake_report_vault_aggregated_info', {'study_id': study_id})['data']

        # Translation table for the frontend
        title_translate = {'totalDatasets': 'Total datasets',
                           'totalFiles': 'Total files',
                           'totalFileSize': 'Total file size',
                           'totalFileSizeMonthGrowth': 'File size growth in a month',
                           'datasetsMonthGrowth': 'Datasets growth in a month',
                           'distinctPseudoCodes': 'Pseudocodes'}

    return render_template('/intake/reports.html', 
            access_denied=access_denied,
            activeModule='intake',
            studies=studies,
            study_id=study_id,
            studyFolder='',
            intakePath=intake_path,
            datasetTypeCounts=counts,
            aggregatedInfo=aggregated_info,
            title_translate=title_translate,
            title='VAULT: Study ' + study_id)
