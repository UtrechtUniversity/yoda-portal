#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import io
import json
import os
from enum import Enum
from typing import List, Optional

import magic
from flask import (
    abort, Blueprint, current_app as app, escape, g, jsonify, make_response, redirect,
    render_template, request, Response, send_file, session, url_for
)
from irods.message import iRODSMessage
from werkzeug.utils import secure_filename

import api


datarequest_bp = Blueprint(
    'datarequest_bp',
    __name__,
    template_folder='templates',
    static_folder='static/datarequest'
)


# Helper functions.
def permission_check(request_id: str, roles: List[str], statuses: Optional[List[str]]) -> bool:
    return api.call('datarequest_action_permitted', {'request_id': request_id,
                                                     'statuses': statuses,
                                                     'roles': roles})['data']


class human_readable_status(Enum):
    DRAFT = 'In draft'
    PENDING_ATTACHMENTS = 'Pending attachments'
    DAO_SUBMITTED = 'Submitted (data assessment)'
    SUBMITTED = 'Submitted'
    PRELIMINARY_ACCEPT = 'Preliminary accept'
    PRELIMINARY_REJECT = 'Rejected at preliminary review'
    PRELIMINARY_RESUBMIT = 'Rejected (resubmit) at preliminary review'
    DATAMANAGER_ACCEPT = 'Datamanager accept'
    DATAMANAGER_REJECT = 'Datamanager reject'
    DATAMANAGER_RESUBMIT = 'Datamanager reject (resubmit)'
    UNDER_REVIEW = 'Under review'
    REJECTED_AFTER_DATAMANAGER_REVIEW = 'Rejected after datamanager review'
    RESUBMIT_AFTER_DATAMANAGER_REVIEW = 'Rejected (resubmit) after datamanager review'
    REVIEWED = 'Reviewed'
    APPROVED = 'Approved'
    REJECTED = 'Rejected'
    RESUBMIT = 'Rejected (resubmit)'
    RESUBMITTED = 'Resubmitted'
    DAO_APPROVED = 'Approved (data assessment)'
    PREREGISTRATION_SUBMITTED = 'Preregistration submitted'
    PREREGISTRATION_CONFIRMED = 'Preregistration confirmed'
    DTA_READY = 'DTA ready'
    DTA_SIGNED = 'DTA signed'
    DATA_READY = 'Data ready'


# Controllers
@datarequest_bp.route('/archive')
def index_archived() -> Response:
    return index(archived=True)


@datarequest_bp.route('/dacrequests')
def index_dacrequests() -> Response:
    return index(dacrequests=True)


@datarequest_bp.route('/index')
@datarequest_bp.route('/')
def index(archived: Optional[bool] = False, dacrequests: Optional[bool] = False) -> Response:
    # Todo: read browser-items-per-page from config

    roles              = api.call('datarequest_roles_get')['data']
    submission_allowed = 'PM' not in roles and 'DM' not in roles
    is_dac_member      = 'DAC' in roles

    return render_template('datarequest/index.html',
                           activeModule='datarequest',
                           archived=archived,
                           dacrequests=dacrequests,
                           submission_allowed=submission_allowed,
                           is_dac_member=is_dac_member,
                           help_contact_name=app.config.get('DATAREQUEST_HELP_CONTACT_NAME'),
                           help_contact_email=app.config.get('DATAREQUEST_HELP_CONTACT_EMAIL'))


@datarequest_bp.route('view/<request_id>')
def view(request_id: str) -> Response:
    roles = api.call('datarequest_roles_get', {'request_id': request_id})['data']

    is_project_manager  = 'PM' in roles
    is_datamanager      = 'DM' in roles
    is_dac_member       = 'DAC' in roles
    is_request_owner    = 'OWN' in roles
    is_reviewer         = 'REV' in roles
    is_pending_reviewer = 'PENREV' in roles

    if not is_project_manager and not is_datamanager and not is_dac_member and not is_request_owner:
        abort(403)

    request_info         = api.call('datarequest_get', {'request_id': request_id})['data']
    request_status       = request_info['requestStatus']
    human_request_status = human_readable_status[request_status].value
    available_documents  = request_info['requestAvailableDocuments']
    request_type         = request_info['requestType']
    request              = json.loads(request_info['requestJSON'])
    if request_type == 'REGULAR':
        publication_type = "Other, namely: " + request['datarequest']['publication_type_other'] if \
                           request['datarequest']['publication_type'] == 'Other (please specify below)' else \
                           request['datarequest']['publication_type']
    else:
        publication_type = None
    attachments          = api.call('datarequest_attachments_get', {'request_id': request_id})['data']

    return render_template('datarequest/view.html',
                           request_id=request_id,
                           request_info=request_info,
                           request_status=request_status,
                           human_request_status=human_request_status,
                           available_documents=available_documents,
                           request_type=request_type,
                           publication_type=publication_type,
                           request=request,
                           is_project_manager=is_project_manager,
                           is_datamanager=is_datamanager,
                           is_dac_member=is_dac_member,
                           is_request_owner=is_request_owner,
                           is_reviewer=is_reviewer,
                           is_pending_reviewer=is_pending_reviewer,
                           attachments=attachments)


@datarequest_bp.route('add')
@datarequest_bp.route('add/<previous_request_id>')
def add(previous_request_id: Optional[str] = None) -> Response:
    if previous_request_id:
        return render_template('datarequest/add.html', previous_request_id=previous_request_id)
    else:
        return render_template('datarequest/add.html')


@datarequest_bp.route('add_from_draft/<draft_request_id>')
def add_from_draft(draft_request_id: str) -> Response:
    if not permission_check(draft_request_id, ['OWN'], None):
        abort(403)
    return render_template('datarequest/add.html', draft_request_id=draft_request_id)


@datarequest_bp.route('add_attachments/<request_id>')
def add_attachments(request_id: str) -> Response:
    if not permission_check(request_id, ['OWN'], ['PENDING_ATTACHMENTS']):
        abort(403)

    attachments = list(map(escape, api.call('datarequest_attachments_get', {'request_id': request_id})['data']))

    return render_template('datarequest/add_attachments.html', attachments=attachments, request_id=request_id)


@datarequest_bp.route('upload_attachment/<request_id>', methods=['POST'])
def upload_attachment(request_id: str) -> Response:
    if not permission_check(request_id, ['OWN'], ['PENDING_ATTACHMENTS']):
        abort(403)

    filename = secure_filename(request.files['file'].filename)
    file_path = os.path.join("/" + g.irods.zone, 'home', 'datarequests-research', request_id, 'attachments', filename)

    result = api.call('datarequest_attachment_upload_permission', {'request_id': request_id, 'action': 'grant'})
    if not result['status'] == 'ok':
        abort(500)

    session = g.irods

    # Get the chunk data.
    data = request.files['file']
    encode_unicode_content = iRODSMessage.encode_unicode(data.stream.read())

    try:
        with session.data_objects.open(file_path, 'w') as obj_desc:
            obj_desc.write(encode_unicode_content)

        obj_desc.close()
    except Exception:
        response = make_response(jsonify({"message": "Upload failed"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    result = api.call('datarequest_attachment_post_upload_actions', {'request_id': request_id, 'filename': filename})
    if not result['status'] == 'ok':
        abort(500)
    result = api.call('datarequest_attachment_upload_permission', {'request_id': request_id, 'action': 'grantread'})
    if not result['status'] == 'ok':
        abort(500)

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@datarequest_bp.route('download_attachment/<request_id>')
def download_attachment(request_id: str) -> Response:
    if not permission_check(request_id, ['PM', 'ED', 'DM', 'DAC', 'OWN'], None):
        abort(403)

    coll_path = os.path.join("/" + g.irods.zone, 'home', 'datarequests-research', request_id, 'attachments')
    file_name = api.call('datarequest_attachments_get', {'request_id': request_id})['data'][int(request.args.get('file'))]
    file_path = os.path.join(coll_path, file_name)

    session = g.irods

    with session.data_objects.open(file_path, 'r') as obj_desc:
        file = obj_desc.read()
        obj_desc.close()
        return send_file(io.BytesIO(file), as_attachment=True, download_name=file_name)


@datarequest_bp.route('submit_attachments/<request_id>')
def submit_attachments(request_id: str) -> Response:
    if not permission_check(request_id, ['OWN'], ['PENDING_ATTACHMENTS']):
        abort(403)

    result = api.call('datarequest_attachments_submit', {'request_id': request_id})

    if result['status'] == 'ok':
        return redirect(url_for('datarequest_bp.view', request_id=request_id))


@datarequest_bp.route('preliminary_review/<request_id>')
def preliminary_review(request_id: str) -> Response:
    if not permission_check(request_id, ['PM'], ['SUBMITTED']):
        abort(403)

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template('datarequest/preliminary_review.html',
                           request_id=request_id,
                           attachments=attachments)


@datarequest_bp.route('datamanager_review/<request_id>')
def datamanager_review(request_id: str) -> Response:
    if not permission_check(request_id, ['DM'], ['PRELIMINARY_ACCEPT']):
        abort(403)

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template('datarequest/datamanager_review.html',
                           request_id=request_id,
                           attachments=attachments)


@datarequest_bp.route('assign/<request_id>')
def assign(request_id: str) -> Response:
    if not permission_check(request_id, ['PM'], ['DATAMANAGER_ACCEPT', 'DATAMANAGER_REJECT', 'DATAMANAGER_RESUBMIT']):
        abort(403)

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template('datarequest/assign.html',
                           request_id=request_id,
                           attachments=attachments)


@datarequest_bp.route('review/<request_id>')
def review(request_id: str) -> Response:
    if not permission_check(request_id, ['REV'], ['UNDER_REVIEW']):
        abort(403)

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template('datarequest/review.html',
                           request_id=request_id,
                           attachments=attachments,
                           username=session['login_username'])


@datarequest_bp.route('evaluate/<request_id>')
def evaluate(request_id: str) -> Response:
    if not permission_check(request_id, ['PM'], ['DAO_SUBMITTED', 'REVIEWED']):
        abort(403)

    if api.call('datarequest_get', {'request_id': request_id})['data']['requestStatus'] == 'DAO_SUBMITTED':
        template = 'datarequest/dao_evaluate.html'
    else:
        template = 'datarequest/evaluate.html'

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template(template,
                           request_id=request_id,
                           attachments=attachments)


@datarequest_bp.route('preregister/<request_id>')
def preregister(request_id: str) -> Response:
    if not permission_check(request_id, ['OWN'], ['APPROVED']):
        abort(403)

    approval_conditions = api.call('datarequest_approval_conditions_get', {'request_id': request_id})['data']
    if approval_conditions is not None:
        approval_conditions = json.loads(approval_conditions)

    return render_template('datarequest/preregister.html', request_id=request_id, approval_conditions=approval_conditions)


@datarequest_bp.route('preregistration_confirm/<request_id>')
def preregistration_confirm(request_id: str) -> Response:
    if not permission_check(request_id, ['PM'], ['PREREGISTRATION_SUBMITTED']):
        abort(403)

    osf_url_json = api.call('datarequest_preregistration_get', {'request_id': request_id})['data']
    osf_url = json.loads(osf_url_json)['preregistration_url']

    return render_template('datarequest/preregistration_confirm.html', request_id=request_id, osf_url=osf_url)


@datarequest_bp.route('confirm_preregistration/<request_id>')
def confirm_preregistration(request_id: str) -> Response:
    if not permission_check(request_id, ['PM'], ['PREREGISTRATION_SUBMITTED']):
        abort(403)

    result = api.call('datarequest_preregistration_confirm', {'request_id': request_id})

    if result['status'] == 'ok':
        return redirect(url_for('datarequest_bp.view', request_id=request_id))


@datarequest_bp.route('upload_dta/<request_id>', methods=['POST'])
def upload_dta(request_id: str) -> Response:
    if not permission_check(request_id, ['DM'], ['PREREGISTRATION_CONFIRMED', 'DAO_APPROVED']):
        abort(403)

    # Verify that uploaded file is a PDF
    mimetype = magic.from_buffer(request.files['file'].stream.read(2048), mime=True)
    request.files['file'].stream.seek(0)
    if not mimetype == "application/pdf":
        response = make_response(jsonify({"message": "Only PDF files are permitted to be uploaded."}), 422)
        response.headers["Content-Type"] = "application/json"
        return response

    filename = secure_filename(request.files['file'].filename)
    file_path = os.path.join("/" + g.irods.zone, 'home', 'datarequests-research', request_id, 'dta', filename)

    result = api.call('datarequest_dta_upload_permission', {'request_id': request_id, 'action': 'grant'})
    if not result['status'] == 'ok':
        abort(500)

    session = g.irods

    # Get the chunk data.
    data = request.files['file']
    encode_unicode_content = iRODSMessage.encode_unicode(data.stream.read())

    try:
        with session.data_objects.open(file_path, 'w') as obj_desc:
            obj_desc.write(encode_unicode_content)

        obj_desc.close()
    except Exception:
        response = make_response(jsonify({"message": "Upload failed"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    result = api.call('datarequest_dta_post_upload_actions', {'request_id': request_id, 'filename': filename})
    if not result['status'] == 'ok':
        abort(500)
    result = api.call('datarequest_dta_upload_permission', {'request_id': request_id, 'action': 'revoke'})
    if not result['status'] == 'ok':
        abort(500)

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@datarequest_bp.route('download_dta/<request_id>')
@datarequest_bp.route('download_signed_dta/<request_id>')
def download_dta(request_id: str) -> Response:
    if not permission_check(request_id, ['PM', 'DM', 'OWN'], None):
        abort(403)

    if request.path == '/datarequest/download_signed_dta/' + request_id:
        file_path = api.call('datarequest_signed_dta_path_get', {'request_id': request_id})['data']
    else:
        file_path = api.call('datarequest_dta_path_get', {'request_id': request_id})['data']

    session = g.irods

    with session.data_objects.open(file_path, 'r') as obj_desc:
        file = obj_desc.read()
        obj_desc.close()
        return send_file(io.BytesIO(file), as_attachment=True, download_name=file_path.split('/')[-1])


@datarequest_bp.route('upload_signed_dta/<request_id>', methods=['POST'])
def upload_signed_dta(request_id: str) -> Response:
    if not permission_check(request_id, ['OWN'], ['DTA_READY']):
        abort(403)

    # Verify that uploaded file is a PDF
    mimetype = magic.from_buffer(request.files['file'].stream.read(2048), mime=True)
    request.files['file'].stream.seek(0)
    if not mimetype == "application/pdf":
        response = make_response(jsonify({"message": "Only PDF files are permitted to be uploaded."}), 422)
        response.headers["Content-Type"] = "application/json"
        return response

    filename = secure_filename(request.files['file'].filename)
    file_path = os.path.join("/" + g.irods.zone, 'home', 'datarequests-research', request_id, 'signed_dta', filename)

    result = api.call('datarequest_signed_dta_upload_permission', {'request_id': request_id, 'action': 'grant'})
    if not result['status'] == 'ok':
        abort(500)

    session = g.irods

    # Get the chunk data.
    data = request.files['file']
    encode_unicode_content = iRODSMessage.encode_unicode(data.stream.read())

    try:
        with session.data_objects.open(file_path, 'w') as obj_desc:
            obj_desc.write(encode_unicode_content)

        obj_desc.close()
    except Exception:
        response = make_response(jsonify({"message": "Upload failed"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    result = api.call('datarequest_signed_dta_post_upload_actions', {'request_id': request_id, 'filename': filename})
    if not result['status'] == 'ok':
        abort(500)
    result = api.call('datarequest_signed_dta_upload_permission', {'request_id': request_id, 'action': 'grantread'})
    if not result['status'] == 'ok':
        abort(500)

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@datarequest_bp.route('data_ready/<request_id>')
def data_ready(request_id: str) -> Response:
    if not permission_check(request_id, ['DM'], ['DTA_SIGNED']):
        abort(403)

    result = api.call('datarequest_data_ready', {'request_id': request_id})

    if result['status'] == 'ok':
        return redirect(url_for('datarequest_bp.view', request_id=request_id))
