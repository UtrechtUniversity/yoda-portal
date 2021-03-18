#!/usr/bin/env python3
import json

from flask import Blueprint, g, jsonify, request
from irods import rule

api_bp = Blueprint('api_bp', __name__)


@api_bp.route('/<fn>', methods=['POST'])
def api(fn, data=None):
    if not authenticated():
        return jsonify({'status': 'nok',
                        'status_info': 'Not authenticated',
                        'data': '{}'})

    form_data = request.form
    if 'data' in form_data:
        data = json.loads(request.form['data'])  # does this need sanitizing for remote code execution?
    elif data is None:
        return jsonify({'status': 'nok',
                        'status_info': 'Missing \'data\' field',
                        'data': '{}'})

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

    return x.decode()


def authenticated():
    return g.user is not None and g.irods is not None


@api_bp.errorhandler(Exception)
def api_error_handler(error):
    status = "internal_error"
    status_info = "Something went wrong"
    data = ""

    return jsonify(
        {
            "status": status,
            "status_info": status_info,
            "data": data
        }), 500
