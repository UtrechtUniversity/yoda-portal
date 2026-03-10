#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2026, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from uuid import UUID

from flask import (
    abort,
    Blueprint,
    g,
    render_template,
    request,
    Response,
)

import api
from cache_config import cache_view

vault_bp = Blueprint('vault_bp', __name__,
                     template_folder='templates',
                     static_folder='static/vault',
                     static_url_path='/assets')


@vault_bp.route('/')
@vault_bp.route('/browse')
@cache_view()
def index() -> Response:
    return render_template('vault/browse.html')


@vault_bp.route('/metadata/form')
def form() -> Response:
    path = request.args.get('path')

    return render_template('vault/metadata-form.html', path=path)


@vault_bp.route('/access', methods=['POST'])
def access() -> Response:
    path = request.form.get('path')
    action = request.form.get('action')

    full_path = '/' + g.irods.zone + '/home' + path

    if action == 'grant':
        response = api.call('grant_read_access_research_group', {"coll": full_path})
    else:
        response = api.call('revoke_read_access_research_group', {"coll": full_path})

    return response


@vault_bp.route('/yoda/<reference>')
def metadata(reference: str) -> Response:
    # Check if Data Package Reference is a valid UUID4.
    try:
        if UUID(reference).version != 4:
            abort(404)
    except ValueError:
        abort(404)

    dir = ''
    # Find data package with provided reference.
    response = api.call('vault_get_package_by_reference',
                        {"reference": reference})

    dp_is_restricted = True
    if response['status'] == 'ok':
        dir = response['data']
        dp_is_restricted = False

    return render_template('vault/datapackage.html',
                           activeModule='vault',
                           dir=dir,
                           reference=reference,
                           dp_is_restricted=dp_is_restricted)
