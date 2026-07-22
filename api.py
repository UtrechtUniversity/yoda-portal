#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2025, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import base64
import hashlib
import re
import sys
import zlib
from timeit import default_timer as timer
from typing import Any, Dict, Optional, Tuple

import orjson
from flask import Blueprint, g, jsonify, request, Response
from flask import current_app as app
from irods import message, rule
from typing_extensions import TypeGuard

from cache_config import cache, clear_api_cache_keys, get_api_cache_timeout, make_key
from errors import InvalidAPIError, UnauthorizedAPIAccessError
from util import log_error

api_bp = Blueprint('api_bp', __name__)


@api_bp.route('/<fn>', methods=['POST'])
def _call(fn: str) -> Response:
    """Handle API calls to specified function.

    :param fn: The name of the API function to call

    :returns: JSON response containing the result of the API call

    :raises UnauthorizedAPIAccessError: If the user is not authenticated
    :raises InvalidAPIError:            If the function name is invalid
    """
    if not authenticated():
        raise UnauthorizedAPIAccessError

    if not re.match(r"^[a-z_]+$", fn):
        raise InvalidAPIError

    parameters = orjson.loads(request.form.get('data', '{}'))
    parsed_result, unparsed_result = _internal_call(fn, parameters)
    status_code = get_response_code(parsed_result)
    return Response(response=unparsed_result,
                    status=status_code,
                    mimetype="application/json")


def get_response_code(result: Dict[str, Any]) -> int:
    """Determine the HTTP response code based on the result status.

    :param result: The result dictionary from the API call

    :returns: HTTP status code
    """
    if result['status'] == 'error_internal':
        return 500
    return 400 if result['status'] != 'ok' else 200


def call(fn: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Call the specified API function with the provided data.

    :param fn:   The name of the API function to call
    :param data: Optional dictionary of data to pass to the function

    :returns: The result of the API call as a dictionary
    """
    return _internal_call(fn, data)[0]


def _internal_call(fn: str, data: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, Any], bytes]:
    """Call the specified API function with the provided data.

    :param fn:   The name of the API function to call
    :param data: Optional dictionary of data to pass to the function

    :returns: The result of the API call as a tuple of a dictionary (the parsed result) and
              bytes (the unparsed result)

    :raises TypeError: if the API response does not have the expected type
    """
    caching_enabled = app.config.get('CACHING_ENABLED', False)
    log_api_duration = app.config.get('LOG_API_CALL_DURATION', False)

    if log_api_duration:
        start_time = timer()

    # Initialize data as an empty dictionary if not provided.
    data = data or {}

    # Prepare parameters.
    params = orjson.dumps(data)
    encoded_params = hashlib.shake_256(params).hexdigest(20)

    cached_result = None
    if caching_enabled:
        # Clear API cache keys if the API function called impacts keys.
        clear_api_cache_keys(fn)

        timeout = get_api_cache_timeout(fn)
        if timeout > 0:
            cached_result = cache.get(make_key(f"{fn}:{encoded_params}"))

    # Execute rule if there is no cached result.
    if cached_result is None:
        result = execute_rule(fn, params)

        # Cache the result if caching is enabled and a timeout is specified
        if caching_enabled and timeout > 0:
            cache.set(make_key(f"{fn}:{encoded_params}"), result, timeout=timeout)
    else:
        result = cached_result

    if log_api_duration:
        end_time = timer()
        call_duration = round((end_time - start_time) * 1000)
        log_message = f"DEBUG: {call_duration:4d}ms api_{fn} {params.decode('utf-8')}"
        if cached_result is not None:
            log_message += " (from cache)"
        print(log_message, file=sys.stderr)

    response = (orjson.loads(result), result)
    if _verify_api_response_type(response):
        return response
    else:
        raise TypeError("Unexpected response type for API call.")


def _verify_api_response_type(response: Any) -> TypeGuard[Tuple[Dict[str, Any], bytes]]:
    return (isinstance(response, tuple)
            and isinstance(response[1], bytes)
            and isinstance(response[0], dict)
            and all(isinstance(k, str) for k in response[0]))


def execute_rule(fn: str, params: bytes) -> str:
    """Execute the specified iRODS rule with the given parameters.

    :param fn:     The name of the API function to execute
    :param params: The parameters to pass to the rule

    :returns: The output of the rule execution as a string.
    """
    def bytesbuf_to_str(s: message.BinBytesBuf) -> str:
        """Convert a BinBytesBuf to a string, handling null termination."""
        s = s.buf[:s.buflen]
        i = s.find(b'\x00')
        return s if i < 0 else s[:i]

    def escape_quotes(s: str) -> str:
        """Escape quotes in a string for safe inclusion in rules."""
        return s.replace('\\', '\\\\').replace('"', '\\"')

    def break_strings(N: int, m: int) -> int:
        """Calculate the number of segments needed to break a string."""
        return (N - 1) // m + 1

    def nrep_string_expr(s: str, m: int = 64) -> str:
        """Break up the string literal to work around limits for both parameter strings
           and literal string constants in the iRODS core code.

        :param s: The string to be broken
        :param m: The maximum length of each segment

        :returns: A string formatted for iRODS rule input
        """
        return '++\n'.join(f'"{escape_quotes(s[i * m:i * m + m])}"' for i in range(break_strings(len(s), m) + 1))

    # Compress params and encode as base64 to reduce size (max rule length in iRODS is 20KB)
    compressed_params = zlib.compress(params)
    base64_encoded_params = base64.b64encode(compressed_params)
    arg_str_expr = nrep_string_expr(base64_encoded_params.decode('utf-8'))

    # Set parameters as variable instead of parameter input to circumvent iRODS string limits.
    rule_body = f''' *x={arg_str_expr}
                    api_{fn}(*x)
                '''

    x = rule.Rule(
        g.irods,
        instance_name='irods_rule_engine_plugin-irods_rule_language-instance',
        body=rule_body,
        params={},
        output='ruleExecOut')

    # Cleanup session for vault actions calling msiExecCmd.
    if fn in ['vault_submit', 'vault_approve', 'vault_cancel', 'vault_depublish', 'vault_republish']:
        g.irods.cleanup()

    x = x.execute(session_cleanup=False)
    return bytesbuf_to_str(x._values['MsParam_PI'][0]._values['inOutStruct']._values['stdoutBuf'])


def authenticated() -> bool:
    """Check if the user is authenticated.

    :returns: True if the user is authenticated, False otherwise
    """
    return g.get('user') is not None and g.get('irods') is not None


@api_bp.errorhandler(Exception)
def api_error_handler(error: Exception) -> Response:
    """Handle exceptions raised during API calls.

    :param error: The exception that was raised

    :returns: A JSON response containing the error details and HTTP status code
    """
    log_error(f'API Error: {error}', True)
    status = "internal_error"
    status_info = "Something went wrong"
    data: Dict[str, Any] = {}
    code = 500  # Default to internal server error.

    # Determine specific error types and set appropriate response details.
    if isinstance(error, InvalidAPIError):
        code = 400
        status_info = "Bad API request"
    elif isinstance(error, UnauthorizedAPIAccessError):
        code = 401
        status_info = "Not authorized to use the API"

    return jsonify(
        {
            "status": status,
            "status_info": status_info,
            "data": data
        }
    ), code
