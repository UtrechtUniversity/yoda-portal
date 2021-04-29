#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'


from flask import Blueprint, current_app, make_response, render_template, request, session
from flask import g

import api


intake_bp = Blueprint('intake_bp', __name__,
                     template_folder='templates',
                     static_folder='static/intake',
                     static_url_path='/intake')

# INTAKE
@intake_bp.route('/', methods=['GET'])
def index():
    study_id = request.args.get('studyID')
    study_folder = request.args.get('studyFolder')

    studies = api.call('intake_list_studies')['data']
    print(studies)

    if study_id is None or len(study_id)==0:
        study_id = studies[0]
    print(study_id)

    # check whether user is part of the study-group.
    # if not, stop access
    permissions = get_intake_study_permissions(study_id)
    print(permissions)
    if not (permissions['manager'] or permissions['assistant']):
        print('NO ACCESS')
        return 'NO ACCESS'

    print('USER HAS ACCESS')
    # user_id = session.get('user_id', None)
    # print(user_id)
    print(g.user)

    ##??? default study_id nog zetten??
    # study dependant intake path.

    # study_id = 'initial'

    intake_path = '/' + g.irods.zone + '/home/grp-intake-' + study_id

#    print(api.call('intake_list_studies')['data'])

#    studies = api.call('intake_list_studies')['data']

#    permissions = get_intake_study_permissions(study_id)
#    print(permissions)

    # $this->data['permissions']=$this->permissions;
    # $this->data['studies']=$this->studies;
    # $this->data['studyID']=$studyID;

    # // study dependant intake path.
    # $this->intake_path = '/' . $this->config->item('rodsServerZone') . '/home/' . $this->config->item('INTAKEPATH_StudyPrefix') . $studyID;

    valid_folders = ['subfolder1', 'subfolder2']

    coll = intake_path
    if study_folder:
        coll += '/' + study_folder

    print(coll)

    datasets = api.call('intake_list_datasets', {"coll": coll})['data']
    print('datasets')
    print(datasets)

    # get the total of dataset files
    total_dataset_files = 0
    for dataset in datasets:
        print('in dataset loop')
        total_dataset_files += dataset['objects']
        print(total_dataset_files)

    data_erroneous_files = api.call('intake_list_unrecognized_files', {"coll": coll})['data']
    print(data_erroneous_files)


    total_file_count = api.call('intake_count_total_files', {"coll": coll})['data']
    print(total_file_count)

    study_title = study_id
    full_path = intake_path
    if study_folder:
        full_path += '/' + study_folder
        study_title += '/' + study_folder
    else:
        study_folder = ''

    # alertdata!!>>??
    return render_template('/intake/intake.html',
            activeModule='intake',
            permissions=permissions,
            studies=studies,
            intakePath=intake_path,
            selectableScanFolders=valid_folders,
            # dir=$dir,  # niet meer nodig
            dataSets=datasets,
            totalDatasetFiles=total_dataset_files,
            dataErroneousFiles=data_erroneous_files,
            totalErrorCount=len(data_erroneous_files),
            totalFileCount=total_file_count,
            studyID=study_id,
            studyFolder=study_folder,
            full_path=full_path,
            title='Study ' + study_title)


def get_intake_study_permissions(study_id):
    return {'assistant': api.call('group_user_is_member', {'username': g.user, 'group_name': 'grp-intake-' + study_id})['data'],
            'manager': api.call('group_user_is_member', {'username': g.user, 'group_name': 'grp-datamanager-' + study_id})['data']}

'''
#    public function scanSelection()
@intake_bp.route('scanSelection', methods=['POST'])
def scan_selection():
    study_id = request.form.get('studyID')
    collections = request.form.get('collections')

    intake_path = '/' + g.irods.zone + '/home/grp-' + study_id
    print(intake_path)


    # ??? alle checks moeten in API call
    result = api.call('intake_scan_for_datasets', {"coll": intake_path})
    print(result)

    return {'result': 0,
            'hasError': False}

'''

@intake_bp.route('getDatasetDetailView', methods=['POST'])
def get_dataset_detail_view():
    study_id = request.form.get('studyID')
    path = request.form.get('path')
    tbl_id = request.form.get('tbl_id')  ## ???? Nog nodig in call - want vanuit javascript
    dataset_id = request.form.get('datasetID')

    intake_path = '/' + g.irods.zone + '/home/grp-' + study_id

    # do checks??

    print(path)

    result = api.call('intake_dataset_get_details',
            {"coll": path, "dataset_id": dataset_id})

    print(result)

    print(result['data'])

    path_items = result['data']['files']

    print('pathItems') 
    print(path_items)
    print('scanned')
    print(result['data']['scanned'])

    datasetErrors = result['data']['dataset_errors']
    datasetWarnings = result['data']['dataset_warnings']
    datasetComments = result['data']['comments']
    list_comments = []
    for comment in datasetComments:
        parts = comment.split(':')
        list_comments.append({'name', parts[0],
                              'time', parts[1],
                              'comment', parts[2]})

    table_definition = render_template('intake/dataset_detail_view.html',
        path_nodes_ordered=sorted(path_items.keys()),
        pathItems=path_items,
        tbl_id=tbl_id,
        datasetPath=path,
        scannedByWhen=result['data']['scanned'].split(':'),
        datasetErrors=datasetErrors,
        datasetWarnings=datasetWarnings,
        datasetComments=list_comments,
        datasetID=dataset_id)

    return {'output': table_definition,
            'hasError': False}

'''
@intake_bp.route('lockDatasets', methods=['POST'])
def lock_datasets():
    has_error = False;
    datasets = request.form.get('datasets')
    study_id = request.form.get('studyID')

    intake_path = '/' + g.irods.zone + '/home/grp-' + study_id 

#????        $this->session->set_userdata('alertOnPageReload', pageLoadAlert('success','LOCK_OK'));
# DIT moet naar javascript verschoven worden

    for dataset in datasets.split(','):
        api.call('intake_lock_dataset', {"path": intake_path, "dataset_id": dataset_id})

    return {'result': 0,
            'hasError': ''}


#    public function unlockDatasets()
@intake_bp.route('unlockDatasets', methods=['POST'])
def unlock_datasets():
    has_error = False;
    datasets = request.form.get('datasets')
    study_id = request.form.get('studyID')

    intake_path = '/' + g.irods.zone + '/home/grp-' + study_id

#    public function unlocktasetDetailView', methods=['POST'])Datasets()
#    public function unlockDatasets()
#????        $this->session->set_userdata('alertOnPageReload', pageLoadAlert('success','LOCK_OK'));
# DIT moet naar javascript verschoven worden

    for dataset in datasets.split(','):
        api.call('intake_unlock_dataset', {"path": intake_path, "dataset_id": dataset_id})

    return {'result': 0,
            'hasError': ''}
'''



'''

#    public function saveDatasetComment()
@intake_bp.route('saveDatasetComment', methods=['POST'])
def save_dataset_comment():
    study_id = request.form.get('studyID')
    dataset_id = request.form.get('datasetID')
    comment = request.form.get('comment')

    intake_path = '/' + g.irods.zone + '/home/grp-' + study_id
 
#        $studyID = $this->input->post('studyID');
#        $datasetID = $this->input->post('datasetID');
#        $comment = $this->input->post('comment');

       $this->output->enable_profiler(FALSE);

#        // return a json representation of the result
#        $this->output->set_content_type('application/json');

#        if(!$this->input->post()){
#            $this->output->set_output(json_encode(array(
#                'result' => 'Invalid request',
#                'hasError' => TRUE
#            )));
#            return;
#        }

#        $studyID = $this->input->post('studyID');
#        $datasetID = $this->input->post('datasetID');
#        $comment = $this->input->post('comment');

        // input validation
        if(!$studyID OR !$datasetID OR !$comment){
            $this->output->set_output(json_encode(array(
                'result' => 'Invalid input',
                'hasError' => TRUE
            )));
            return;
        }

        # check input
        if not (study_id and dataset_id and comment):
            return {'result': 'Invalid input',
                    'hasError': True}

        # MOET ACHTER API
        # assistant and manager both are allowed to view the details of a dataset.
        $errorMessage='';
        if not validateIntakeStudyPermissions(study_id, $permissionsAllowed=array($this->user->ROLE_Manager,$this->user->ROLE_Assistant), $errorMessage):
            return {'result': 'Insufficient rights',
                    'hasError': True}

        // do save action.
        $comment_data = api.call('intake_dataset_add_comment',
            {"coll": intake_path, "dataset_id": dataset_id, "comment": comment})

        # Return the new row data so requester can add in comments table 
        return {'user':, 
                'timestamp': ,
                'comment': ,
                'hasError': False}
#        $this->output->set_output(json_encode(array(
#                'output' => array('user'=>  $this->rodsuser->getUsername(),
#                                'timestamp'=>date('Y-m-d H:i:s'),
#                                'comment'=>$comment),
#                'hasError' => FALSE


#    public function scanSelection()
@intake_bp.route('scanSelection', methods=['POST'])
def scan_selection():
    study_id = request.form.get('studyID')
    collections = request.form.get('collections')

    intake_path = '/' + g.irods.zone + '/home/grp-' + study_id

    

    # ??? alle checks moeten in API call 
    result = api->call('intake_scan_for_datasets', {"coll": intake_path})

    return {'result': ,
            'hasError': ??}


# EXPORT
#    public function download($studyID=null)
@intake_bp.route('download', methods=['GET'])
def export():
#    filepath = '/' + g.irods.zone + '/home' + request.args.get('filepath')
#    content = ''
    session = g.irods

#    obj = session.data_objects.get(filepath)
#    with obj.open('r') as f:
#        content = f.read()
#        # seek EOF to get file size
#        f.seek(0, 2)
#        size = f.tell()

        if(!$studyID){
            echo '"Valid study required"';
            return FALSE;
        }

        if(!$this->user->validateStudy($this->studies, $studyID)){
            echo 'Invalid study';
            return FALSE;
        }

        if(!$this->user->isGroupMember($this->rodsuser->getRodsAccount(), $this->user->PERM_GroupDataManager . $studyID, $this->rodsuser->getUsername())){
            echo "You have no rights for this report of this study";
            return FALSE;
        }

//        $exportData = $this->dataset->exportVaultDatasetInfo($studyID);
        $exportDataAPI = $this->api->call('intake_report_export_study_data', ['study_id'=>$studyID])->data;

        content = '"Study",';
        content += '"Wave,"';
        content += '"ExpType,"';
        content += '"Pseudo,"';
        content += '"Version,"';
        content += '"ToVaultDay,"';
        content += '"ToVaultMonth,"';
        content += '"ToVaultYear,"';
        content += '"DatasetSize,"';
        content += '"DatasetFiles"';
        content += "\r\n";

        foreach($exportDataAPI as $dataClass) {
            # $data = (array) $dataClass;
            content += "'" + study_id + "',"
            content += "'" +  data['wave']  + "',"
            content += "'" + data['experiment_type'] + "',"
            content += "'" + data['pseudocode'] + "',"
            content += "'" + data['version'] + "',"
            content += ??? date('j,n,Y',  data['dataset_date_created']) + "',"
            content += str(data['totalFileSize']) + "',"
            content += str(data['totalFiles']) + "',"
            content += "\r\n"
        }

    output = make_response(content)
    size = len(content)

    output.headers['Content-Disposition'] = 'attachment; filename="{}"'.format(request.args.get('filepath'))
    output.headers['Content-Type'] = 'application/octet'
    output.headers['Content-Length'] = size

    return output


# REPORTS 
#     public function index($studyID=null)
@intake_bp.report('report', methods=['GET'])
def report(): 
public function index($studyID=null)
    {
        // studyID handling from session info
        if(!$studyID){
            if($tempID = $this->session->userdata('studyID') AND $tempID){
                $studyID = $tempID;
            }
        }

        $this->data['title'] = 'VAULT: NO ACCESS'; // only after knowing for sure that this person has the proper rights the title will change

        // Studies (held in $this->studies) are limited to studies with datamanager-access only

        $error = '';
        if(!$this->studies) {
            $error = 'ACCESS_NO_DATAMANAGER';
        }

        if(!$this->user->validateStudy($this->studies, $studyID)){
            $error = 'ACCESS_INVALID_STUDY';
        }

        if ($error != '') {
            $viewParams = array(
                'styleIncludes' => array(
                ),
                'scriptIncludes' => array(
                    'scripts/controllers/reports.js',
                ),
                'error' => $error,
                'activeModule'   => 'intake',
                'studies' => $this->studies,
                'title' => 'VAULT: Study ' . $studyID,
            );
            loadView('/reports/index', $viewParams);
            return;
        }
        // study is validated. Put in session.
        $this->session->set_userdata('studyID',$studyID);

        $this->intake_path = '/' . $this->config->item('rodsServerZone') . '/home/' . $this->config->item('INTAKEPATH_StudyPrefix') . $studyID;

        $counts = $this->api->call('intake_report_vault_dataset_counts_per_study', ['study_id' => $studyID])->data;

        $data = $this->api->call('intake_report_vault_aggregated_info', ['study_id' => $studyID])->data;

        $viewParams = array(
            'styleIncludes' => array(
            ),
            'scriptIncludes' => array(
                  'scripts/controllers/reports.js',
            ),
            'error' => $error,
            'activeModule'   => 'intake',
            'moduleGlyph' => $this->config->item('module-glyph'),
            'studies' => $this->studies,
            'intakePath' => $this->intake_path,
            'datasetTypeCounts' => $counts,
            'aggregatedInfo' => $data,
            'studyID' => $studyID,
            'studyFolder' => '',
            'title' => 'VAULT: Study ' . $studyID,
        );
        loadView('/reports/index', $viewParams);
    render_template('/reports/index', 
            'styleIncludes' => array(
            ),
            'scriptIncludes' => array(
                  'scripts/controllers/reports.js',
            ),
            'error' => $error,
            'activeModule'   => 'intake',
            'moduleGlyph' => $this->config->item('module-glyph'),
            'studies' => $this->studies,
            'intakePath' => $this->intake_path,
            'datasetTypeCounts' => $counts,
            'aggregatedInfo' => $data,
            'studyID' => $studyID,
            'studyFolder' => '',
            'title' => 'VAULT: Study ' . $studyID)



######################################################
@vault_bp.route('/', methods=['GET'])
def index():
    items = current_app.config['browser-items-per-page']
    dir = request.args.get('dir')

    # Hoe dit te vertalen??
    if dir is None:
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
                           dir=dir)


@vault_bp.route('/browse/download', methods=['GET'])
def download():
    filepath = '/' + g.irods.zone + '/home' + request.args.get('filepath')
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
    except Exception:
        # REDIRECT research/browse ???????
        # return redirect(url_for('index'))
        to_be_changed = True

    path_start = '/' + g.irods.zone + '/home'

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

    return 'OK'


@vault_bp.route('/search/set_session', methods=['POST'])
def set_session():
    value = request.form.get('value')
    type = request.form.get('type')

    if type == 'status':
        session['research-search-status-value'] = value
    else:
        session['research-search-term'] = value
        session.pop('research-search-status-value', None)

    session['research-search-type'] = type
    session['research-search-start'] = 0

    return 'OK'


@vault_bp.route('/access', methods=['POST'])
def access():
    path = request.form.get('path')
    action = request.form.get('action')

    full_path = '/' + g.irods.zone + '/home' + path

    if action == 'grant':
        response = api.call('grant_read_access_research_group', {"coll": full_path})
    else:
        response = api.call('revoke_read_access_research_group', {"coll": full_path})

    return response

'''
