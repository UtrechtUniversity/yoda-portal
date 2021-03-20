#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import json
from flask import Blueprint, g, jsonify, request
from irods import rule
from errors import UnauthorizedAPIAccessError

api_bp = Blueprint('api_bp', __name__)


@api_bp.route('/<fn>', methods=['POST'])
def _call(fn):
    if not authenticated():
        raise UnauthorizedAPIAccessError

    if 'data' in request.form:
        data = json.loads(request.form['data'])
    else:
        data = {}

    result = call(fn, data)
    code = 200

    if result['status'] == 'error_internal':
        code = 500
    elif result['status'] != 'ok':
        code = 400

    response = jsonify(result)
    response.status_code = code
    return response

def call(fn, data=None):
    if data is None:
        data = {}

    sanitized_params = json.dumps(data) \
        .replace('\\', '\\\\') \
        .replace('"', '\\"')

    x = rule.Rule(
        g.irods,
        body='a {{ api_{}(*x); }}'.format(fn),
        params={'*x': '"{}"'.format(sanitized_params)},
        output='ruleExecOut')

    x = x.execute()
    x = x._values['MsParam_PI'][0]._values['inOutStruct']._values['stdoutBuf']
    x = x.buf[:x.buflen]
    if b'\x00' in x:
        x = x[:x.find(b'\x00')]

    result = x.decode()

    return json.loads(result)


def authenticated():
    return g.get('user') is not None and g.get('irods') is not None


@api_bp.errorhandler(Exception)
def api_error_handler(error):
    print('API Error: {}'.format(error))
    status = "internal_error"
    status_info = "Something went wrong"
    data = {}
    code = 500

    if type(error) == MissingDataError:
        status_info = "The API request was missing the 'data' parameter"
    elif type(error) == UnauthorizedAPIAccessError:
        status_info = "Not authorized to use the API"

    return jsonify(
        {
            "status": status,
            "status_info": status_info,
            "data": data
        }), code
