#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import magic
import io
import json
import os

from flask import (
    abort, Blueprint, escape, g, jsonify, make_response, redirect, render_template, request, send_file, session, url_for
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
def permission_check(request_id, roles, statuses):
    return api.call('datarequest_action_permitted', {'request_id': request_id,
                                                     'statuses': statuses,
                                                     'roles': roles})['data']


def human_readable_status(request_status):
    if request_status == "DRAFT":
        return "In draft"
    elif request_status == "PENDING_ATTACHMENTS":
        return "Pending attachments"
    elif request_status == "DAO_SUBMITTED":
        return "Submitted (data assessment)"
    elif request_status == "SUBMITTED":
        return "Submitted"
    elif request_status == "PRELIMINARY_ACCEPT":
        return "Preliminary accept"
    elif request_status == "PRELIMINARY_REJECT":
        return "Rejected at preliminary review"
    elif request_status == "PRELIMINARY_RESUBMIT":
        return "Rejected (resubmit) at preliminary review"
    elif request_status == "DATAMANAGER_ACCEPT":
        return "Datamanager accept"
    elif request_status == "DATAMANAGER_REJECT":
        return "Datamanager reject"
    elif request_status == "DATAMANAGER_RESUBMIT":
        return "Datamanager reject (resubmit)"
    elif request_status == "UNDER_REVIEW":
        return "Under review"
    elif request_status == "REJECTED_AFTER_DATAMANAGER_REVIEW":
        return "Rejected after datamanager review"
    elif request_status == "RESUBMIT_AFTER_DATAMANAGER_REVIEW":
        return "Rejected (resubmit) after datamanager review"
    elif request_status == "REVIEWED":
        return "Reviewed"
    elif request_status == "APPROVED":
        return "Approved"
    elif request_status == "REJECTED":
        return "Rejected"
    elif request_status == "RESUBMIT":
        return "Rejected (resubmit)"
    elif request_status == "RESUBMITTED":
        return "Resubmitted"
    elif request_status == "DAO_APPROVED":
        return "Approved (data assessment)"
    elif request_status == "PREREGISTRATION_SUBMITTED":
        return "Preregistration submitted"
    elif request_status == "PREREGISTRATION_CONFIRMED":
        return "Preregistration confirmed"
    elif request_status == "DTA_READY":
        return "DTA ready"
    elif request_status == "DTA_SIGNED":
        return "DTA signed"
    elif request_status == "DATA_READY":
        return "Data ready"


# Controllers
@datarequest_bp.route('/archive')
def index_archived():
    return index(archived=True)


@datarequest_bp.route('/dacrequests')
def index_dacrequests():
    return index(dacrequests=True)


@datarequest_bp.route('/index')
@datarequest_bp.route('/')
def index(archived=False, dacrequests=False):
    # Todo: read browser-items-per-page from config
    items = 10

    roles              = api.call('datarequest_roles_get')['data']
    submission_allowed = 'PM' not in roles and 'DM' not in roles
    is_dac_member      = 'DAC' in roles

    return render_template('datarequest/index.html',
                           activeModule='datarequest',
                           items=items,
                           archived=archived,
                           dacrequests=dacrequests,
                           submission_allowed=submission_allowed,
                           is_dac_member=is_dac_member,
                           help_contact_name='Todo_help_contact_name',
                           help_contact_email='Todo_help_contact_email')


@datarequest_bp.route('view/<request_id>')
def view(request_id):
    roles = api.call('datarequest_roles_get', {'request_id': request_id})['data']

    if 'PM' not in roles and 'DM' not in roles and 'DAC' not in roles and 'OWN' not in roles:
        abort(403)

    is_project_manager  = 'PM' in roles
    is_datamanager      = 'DM' in roles
    is_dac_member       = 'DAC' in roles
    is_request_owner    = 'OWN' in roles
    is_reviewer         = 'REV' in roles
    is_pending_reviewer = 'PENREV' in roles

    request_info         = api.call('datarequest_get', {'request_id': request_id})['data']
    request_status       = request_info['requestStatus']
    available_documents  = request_info['requestAvailableDocuments']
    human_request_status = human_readable_status(request_status)
    request_type         = request_info['requestType']
    request              = json.loads(request_info['requestJSON'])
    attachments          = api.call('datarequest_attachments_get', {'request_id': request_id})['data']

    return render_template('datarequest/view.html',
                           request_id=request_id,
                           request_info=request_info,
                           request_status=request_status,
                           available_documents=available_documents,
                           human_request_status=human_request_status,
                           request_type=request_type,
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
def add(previous_request_id=None):
    if previous_request_id:
        return render_template('datarequest/add.html', previous_request_id=previous_request_id)
    else:
        return render_template('datarequest/add.html')


@datarequest_bp.route('add_from_draft/<draft_request_id>')
def add_from_draft(draft_request_id):
    if not permission_check(draft_request_id, ['OWN'], None):
        abort(403)
    return render_template('datarequest/add.html', draft_request_id=draft_request_id)


@datarequest_bp.route('add_attachments/<request_id>')
def add_attachments(request_id):
    if not permission_check(request_id, ['OWN'], ['PENDING_ATTACHMENTS']):
        abort(403)

    attachments = list(map(escape, api.call('datarequest_attachments_get', {'request_id': request_id})['data']))

    return render_template('datarequest/add_attachments.html', attachments=attachments, request_id=request_id)


@datarequest_bp.route('upload_attachment/<request_id>', methods=['POST'])
def upload_attachment(request_id):
    if not permission_check(request_id, ['OWN'], ['PENDING_ATTACHMENTS']):
        abort(403)

    filename = secure_filename(request.files['file'].filename)
    file_path = os.path.join("/" + g.irods.zone, 'home', 'datarequests-research', request_id, 'attachments', filename)

    api.call('datarequest_attachment_upload_permission', {'request_id': request_id, 'action': 'grant'})

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

    api.call('datarequest_attachment_post_upload_actions', {'request_id': request_id, 'filename': filename})
    api.call('datarequest_attachment_upload_permission', {'request_id': request_id, 'action': 'grantread'})

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@datarequest_bp.route('download_attachment/<request_id>')
def download_attachment(request_id):
    if not permission_check(request_id, ['PM', 'ED', 'DM', 'DAC', 'OWN'], None):
        abort(403)

    coll_path = os.path.join("/" + g.irods.zone, 'home', 'datarequests-research', request_id, 'attachments')
    file_name = api.call('datarequest_attachments_get', {'request_id': request_id})['data'][int(request.args.get('file'))]
    file_path = os.path.join(coll_path, file_name)

    session = g.irods

    with session.data_objects.open(file_path, 'r') as obj_desc:
        file = obj_desc.read()
        obj_desc.close()
        return send_file(io.BytesIO(file), as_attachment=True, attachment_filename=file_name)


@datarequest_bp.route('submit_attachments/<request_id>')
def submit_attachments(request_id):
    if not permission_check(request_id, ['OWN'], ['PENDING_ATTACHMENTS']):
        abort(403)

    result = api.call('datarequest_attachments_submit', {'request_id': request_id})

    if result['status'] == 'ok':
        return redirect(url_for('datarequest_bp.view', request_id=request_id))


@datarequest_bp.route('preliminary_review/<request_id>')
def preliminary_review(request_id):
    if not permission_check(request_id, ['PM'], ['SUBMITTED']):
        abort(403)

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template('datarequest/preliminary_review.html',
                           request_id=request_id,
                           attachments=attachments)


@datarequest_bp.route('datamanager_review/<request_id>')
def datamanager_review(request_id):
    if not permission_check(request_id, ['DM'], ['PRELIMINARY_ACCEPT']):
        abort(403)

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template('datarequest/datamanager_review.html',
                           request_id=request_id,
                           attachments=attachments)


@datarequest_bp.route('assign/<request_id>')
def assign(request_id):
    if not permission_check(request_id, ['PM'], ['DATAMANAGER_ACCEPT', 'DATAMANAGER_REJECT', 'DATAMANAGER_RESUBMIT']):
        abort(403)

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template('datarequest/assign.html',
                           request_id=request_id,
                           attachments=attachments)


@datarequest_bp.route('review/<request_id>')
def review(request_id):
    if not permission_check(request_id, ['REV'], ['UNDER_REVIEW']):
        abort(403)

    attachments = api.call('datarequest_attachments_get', {'request_id': request_id})['data']
    return render_template('datarequest/review.html',
                           request_id=request_id,
                           attachments=attachments,
                           username=session['login_username'])


@datarequest_bp.route('evaluate/<request_id>')
def evaluate(request_id):
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
def preregister(request_id):
    if not permission_check(request_id, ['OWN'], ['APPROVED']):
        abort(403)

    approval_conditions = json.loads(api.call('datarequest_approval_conditions_get', {'request_id': request_id})['data'])

    return render_template('datarequest/preregister.html', request_id=request_id, approval_conditions=approval_conditions)


@datarequest_bp.route('preregistration_confirm/<request_id>')
def preregistration_confirm(request_id):
    if not permission_check(request_id, ['PM'], ['PREREGISTRATION_SUBMITTED']):
        abort(403)

    osf_url_json = api.call('datarequest_preregistration_get', {'request_id': request_id})['data']
    osf_url = json.loads(osf_url_json)['preregistration_url']

    return render_template('datarequest/preregistration_confirm.html', request_id=request_id, osf_url=osf_url)


@datarequest_bp.route('confirm_preregistration/<request_id>')
def confirm_preregistration(request_id):
    if not permission_check(request_id, ['PM'], ['PREREGISTRATION_SUBMITTED']):
        abort(403)

    result = api.call('datarequest_preregistration_confirm', {'request_id': request_id})

    if result['status'] == 'ok':
        return redirect(url_for('datarequest_bp.view', request_id=request_id))


@datarequest_bp.route('upload_dta/<request_id>', methods=['POST'])
def upload_dta(request_id):
    if not permission_check(request_id, ['DM'], ['PREREGISTRATION_CONFIRMED', 'DAO_APPROVED']):
        abort(403)

    # Verify that uploaded file is a PDF
    mimetype = magic.from_buffer(request.files['file'].stream.read(2048), mime = True)
    if not mimetype == "application/pdf":
        response = make_response(jsonify({"message": "Only PDF files are permitted to be uploaded."}), 422)
        response.headers["Content-Type"] = "application/json"
        return response

    filename = secure_filename(request.files['file'].filename)
    file_path = os.path.join("/" + g.irods.zone, 'home', 'datarequests-research', request_id, 'dta', filename)

    api.call('datarequest_dta_upload_permission', {'request_id': request_id, 'action': 'grant'})

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

    api.call('datarequest_dta_post_upload_actions', {'request_id': request_id, 'filename': filename})
    api.call('datarequest_dta_upload_permission', {'request_id': request_id, 'action': 'revoke'})

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@datarequest_bp.route('download_dta/<request_id>')
@datarequest_bp.route('download_signed_dta/<request_id>')
def download_dta(request_id):
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
        return send_file(io.BytesIO(file), as_attachment=True, attachment_filename=file_path.split('/')[-1])


@datarequest_bp.route('upload_signed_dta/<request_id>', methods=['POST'])
def upload_signed_dta(request_id):
    if not permission_check(request_id, ['OWN'], ['DTA_READY']):
        abort(403)

    # Verify that uploaded file is a PDF
    mimetype = magic.from_buffer(request.files['file'].stream.read(2048), mime = True)
    if not mimetype == "application/pdf":
        response = make_response(jsonify({"message": "Only PDF files are permitted to be uploaded."}), 422)
        response.headers["Content-Type"] = "application/json"
        return response

    filename = secure_filename(request.files['file'].filename)
    file_path = os.path.join("/" + g.irods.zone, 'home', 'datarequests-research', request_id, 'signed_dta', filename)

    api.call('datarequest_signed_dta_upload_permission', {'request_id': request_id, 'action': 'grant'})

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

    api.call('datarequest_signed_dta_post_upload_actions', {'request_id': request_id, 'filename': filename})
    api.call('datarequest_signed_dta_upload_permission', {'request_id': request_id, 'action': 'grantread'})

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@datarequest_bp.route('data_ready/<request_id>')
def data_ready(request_id):
    if not permission_check(request_id, ['DM'], ['DTA_SIGNED']):
        abort(403)

    result = api.call('datarequest_data_ready', {'request_id': request_id})

    if result['status'] == 'ok':
        return redirect(url_for('datarequest_bp.view', request_id=request_id))
