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
    def bytesbuf_to_str(s):
        s = s.buf[:s.buflen]
        i = s.find(b'\x00')
        return s if i < 0 else s[:i]

    def escape_quotes(s):
        return s.replace('\\', '\\\\').replace('"', '\\"')

    def break_strings(N, m):
        return (N - 1) // m + 1

    def nrep_string_expr(s, m=64):
        return ' ++\n'.join('"{}"'.format(escape_quotes(s[i * m:i * m + m])) for i in range(break_strings(len(s), m) + 1))

    if data is None:
        data = {}

    params = json.dumps(data)
    arg_str_expr = nrep_string_expr(params)

    # Set parameters as variable instead of parameter input to circumvent iRODS string limits.
    rule_body = '''a {{ *x={}
                        api_{}(*x)
                     }}
                '''.format(arg_str_expr, fn)

    x = rule.Rule(
        g.irods,
        body=rule_body,
        params={},
        output='ruleExecOut')

    x = x.execute()
    x = bytesbuf_to_str(x._values['MsParam_PI'][0]._values['inOutStruct']._values['stdoutBuf'])

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

    if type(error) == UnauthorizedAPIAccessError:
        status_info = "Not authorized to use the API"

    return jsonify(
        {
            "status": status,
            "status_info": status_info,
            "data": data
        }), code
