#!/usr/bin/env python3
from flask import Blueprint, render_template

import api


vault_bp = Blueprint('vault_bp', __name__,
                     template_folder='templates/vault',
                     static_folder='static/vault')

import browse, metadata, search

@vault_bp.route('/access')
def access():
    path = request.args.get('path')
    action = request.args.get('action')

    full_path = configuration['path_start'] + path

    if action == 'grant':
        response =  api.call('grant_read_access_research_group', {"coll": full_path})
    else:
        response =  api.call('revoke_read_access_research_group', {"coll": full_path})

    return jsonify(response)

@vault_bp.route('/copyVaultPackageToDynamicArea')
def copyVaultPackageToDynamicArea():

    path_start = configuration['path_start']

    fulltarget_path = path_start + request.args.get('targetdir')
    fullorg_path = path_start + request.args.get('targetdir')

    ### OPLOSSEN
    result = $this->Data_Request_model->copy_package_from_vault($fullOrgPath, $fullTargetPath);
    output = {('status': result['status'],
               'statusInfo': result['statusInfo']}

    return jsonify(output)
