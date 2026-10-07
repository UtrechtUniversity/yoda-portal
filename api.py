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
from irods import exception as irods_ex
from irods import rule
from irods.api_number import api_number
from irods.connection import Connection
from irods.message import (
    iRODSMessage,
    MsParamArray,
    RodsHostAddress,
    RuleExecutionRequest,
    StringStringMap,
)
from typing_extensions import TypeGuard

from cache_config import cache, clear_api_cache_keys, get_api_cache_timeout, make_key
from errors import InvalidAPIError, UnauthorizedAPIAccessError
from util import bytesbuf_to_bytes, log_error, nrep_string_expr

RULE_ENGINE_INSTANCE = 'irods_rule_engine_plugin-irods_rule_language-instance'
MULTIPART_MAX_CHUNK_SIZE = 15000   # Characters of base64 payload per part.
MULTIPART_MAX_TOTAL_SIZE = 300000  # Maximum total compressed size of multi-part request

api_bp = Blueprint('api_bp', __name__)


class MultiPartRequestException(Exception):
    pass


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


def execute_rule(fn: str, params: bytes) -> bytes:
    """Execute the specified iRODS rule with the given parameters.

    :param fn:     The name of the API function to execute
    :param params: The parameters to pass to the rule

    :returns: The output of the rule execution (JSON)

    :raises MultiPartRequestException: If an error occurs during processing
                   a multi-part API request
    """
    def chunk_parameters(inp: str) -> list[str]:
        if len(inp) > MULTIPART_MAX_TOTAL_SIZE:
            raise MultiPartRequestException("Total compressed size of parameters exceeds multi-part size limit.")
        return [inp[n:n + MULTIPART_MAX_CHUNK_SIZE] for n in range(0, len(inp), MULTIPART_MAX_CHUNK_SIZE)]

    # Compress params and encode as base64 to reduce size (max rule length in iRODS is 20KB)
    checksum = hashlib.shake_256(params).hexdigest(20)
    parameter_chunks = chunk_parameters(_compress_parameters(params))

    if len(parameter_chunks) == 1:
        return _execute_rule(fn, parameter_chunks[0])
    else:
        try:
            return _execute_rule_multipart(fn, parameter_chunks, checksum)
        except MultiPartRequestException as e:
            log_error('API Multi-part Error: ' + str(e), True)
            raise e from e


def _execute_rule_multipart(fn: str, parameter_chunks: list[str], checksum: str) -> bytes:
    with g.irods.pool.get_connection() as connection:
        _ensure_ok_multipart(_execute_rule_single_agent(
            "stage_multipart_request_clear",
            _compress_parameters(b"{}"),
            connection))
        for parameter_chunk in parameter_chunks:
            _ensure_ok_multipart(_execute_rule_single_agent(
                "stage_multipart_request_submit",
                _compress_parameters(orjson.dumps({"chunk": parameter_chunk})),
                connection))
        return _execute_rule_single_agent("stage_multipart_request_run",
                                          _compress_parameters(orjson.dumps({"function": fn, "checksum": checksum})),
                                          connection=connection)


def _ensure_ok_multipart(response: bytes) -> None:
    """Ensure that a response has an OK status. If not, raise
       a MultiPartRequestException.

       :param response: the response to the API call

       :raises MultiPartRequestException: if status is not OK or cannot be determined
    """
    try:
        parsed_response = orjson.loads(response)
        if parsed_response.get("status", "") != "ok":
            raise MultiPartRequestException("Response for multi-part request has error status")
    except orjson.JSONDecodeError as e:
        raise MultiPartRequestException("Cannot decode response for multi-part request.") from e


def _execute_rule_single_agent(fn: str, encoded: str, connection: Connection) -> bytes:
    """Execute API rule api_<fn> on a specific connection.

    Similar _execute_rule, but this one is meant to be used when we need
    to be sure all requests are transmitted on the same connection (e.g. with
    multi-part requests).

    :param fn: function name (without api_ prefix)
    :param encoded: base64 encoded parameters
    :param connection: iRODSConnection to transmit to

    :returns: output of API function

    :raises Exception: If transmitting API call fails
    """
    request = iRODSMessage('RODS_API_REQ',
                           msg=RuleExecutionRequest(
                               myRule=_rule_text(fn, encoded),
                               addr=RodsHostAddress(hostAddr='', rodsZone='', port=0, dummyInt=0),
                               condInput=StringStringMap({'instance_name': RULE_ENGINE_INSTANCE}),
                               outParamDesc='ruleExecOut',
                               inpParamArray=MsParamArray(paramLen=0, oprType=0, MsParam_PI=[])),
                           int_info=api_number['EXEC_MY_RULE_AN'])

    connection.send(request)
    response = connection.recv(acceptable_errors=(irods_ex.FAIL_ACTION_ENCOUNTERED_ERR,))
    try:
        out = response.get_main_message(MsParamArray)
    except iRODSMessage.ResponseNotParseable as e:
        raise Exception(f'api_{fn}: rule returned no output') from e

    return bytesbuf_to_bytes(out._values['MsParam_PI'][0]._values['inOutStruct']._values['stdoutBuf'])


def _rule_text(fn: str, encoded: str) -> str:
    """Construct the text of a rule that calls API rule api_<fn>.

    The rule body is wrapped in the same way as irods.rule.Rule does,
    because the rule language cannot parse a bare rule body.

    :param fn:      function name (without api_ prefix)
    :param encoded: base64 encoded parameters

    :returns: rule text
    """
    # Set parameters as variable instead of parameter input to circumvent iRODS string limits.
    arg_str_expr = _string_to_rule_string(encoded)
    rule_body = f''' *x={arg_str_expr}
                    api_{fn}(*x)
                '''
    return '@external rule { ' + rule_body + ' }'


def _compress_parameters(params: bytes) -> str:
    """Compress params and encode as base64 to reduce size
       (max rule length in iRODS is 20KB)

       :param params: Parameters as JSON

       :returns:      Base64 compressed data
    """
    compressed_params = zlib.compress(params)
    return base64.b64encode(compressed_params).decode("ascii")


def _string_to_rule_string(params: str) -> str:
    """Convert base64-compressed parameters to a format that can
       be put into a rule.

       :param params: base64 encoded parameters

       :returns: the encoded parameters in a format that can be put
                 into a rule"""
    return nrep_string_expr(params)


def _execute_rule(fn: str, parameters: str) -> bytes:
    arg_str_expr = _string_to_rule_string(parameters)

    # Set parameters as variable instead of parameter input to circumvent iRODS string limits.
    rule_body = f'''*x={arg_str_expr}
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
    return bytesbuf_to_bytes(x._values['MsParam_PI'][0]._values['inOutStruct']._values['stdoutBuf'])


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
