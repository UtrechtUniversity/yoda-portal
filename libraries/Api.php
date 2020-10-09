<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/**
 * Yoda API library
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2019-2020, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */
class Api
{
    public $CI;

    public function __construct()
    {
        // Get the CI instance
        $this->CI  =& get_instance();
    }

    /**
     * \brief Calls an API function by name.
     *
     * API arguments passed as a JSON string.
     * The return value is an assoc-array.
     *
     * This function is intended for passing JSON request bodies straight to
     * iRODS. See the `call` function further down for a more usable PHP variant.
     *
     * The returned value always contains exactly 3 fields:
     * - status      either "ok" "error_X" (for any X) or a custom status.
     * - status_info provides extra info if the status is not "ok" - must be user-understandable.
     * - data        contains API return value(s). may be null.
     */
    private function call_($name, $json) {

        $acc =  $this->CI->rodsuser->getRodsAccount();

        // Return extra debug info to the frontend, if available.
        $isDevel = $this->CI->config->item('yodaVersion') === 'development';

        // Validate rule name.
        if (!preg_match('/^[a-zA-Z0-9_]{1,256}$/', $name)) {
            // Avoid sending garbage/manipulated rule bodies.
            $err = sprintf('API call with invalid name: <%s>', rawurlencode($name));
            error_log($err);
            $ret = (object)['status'      => 'error_api',
                            'status_info' => 'An internal error occurred (invalid API call)',
                            'data'        => null];

            if ($isDevel)
                $ret->debug_info = $err;
            return $ret;
        }

        // Try to call the rule and parse results, catch errors.
        try {
            $rule = new ProdsRule($acc,
                                  "rule { api_$name(*data); }",
                                  ['*data' => $json],
                                  ['ruleExecOut']);

            $ret = json_decode($rule->execute()['ruleExecOut'],
                               false, 512, JSON_THROW_ON_ERROR);

        } catch (RODSException $e) {
            $err = sprintf("API call <$name> generated an iRODS error: %s", (string)$e);
            error_log($err);
            $ret = (object)['status'      => 'error_internal',
                            'status_info' => 'An internal error occurred',
                            'data'        => null];
            if ($isDevel)
                $ret->debug_info = $err;
            return $ret;

        } catch (JsonException $e) {
            $err = "API call <$name> returned invalid JSON";
            error_log($err);
            $ret = (object)['status'      => 'error_internal',
                            'status_info' => 'An internal error occurred',
                            'data'        => null];

            if ($isDevel)
                $ret->debug_info = $err;
            return $ret;
        }

        // These must always be present, even if they're null.
        if (!property_exists($ret, 'status')
         || !property_exists($ret, 'status_info')
         || !property_exists($ret, 'data')) {

            $err = "API call <$name> returned an invalid result (missing status/status_info)";
            error_log($err);
            $ret = (object)['status'      => 'error_internal',
                            'status_info' => 'An internal error occurred',
                            'data'        => null];

            if ($isDevel)
                $ret->debug_info = $err;
        }
        return $ret;
    }

    /// JSON string OR assoc-array in. Assoc-array out.
    /// If $data isn't a string, it is automatically encoded as JSON.
    /// The JSON representation of the input data should always be an
    /// object/dictionary/assoc-array (i.e. {...}).
    /// API functions without arguments can be called without passing a $data object.
    public function call($name, $data='{}') {
        if (gettype($data) !== 'string')
            $data = json_encode($data);
        $result = $this->call_($name, $data);
        if ($result->status == 'internal') {
            set_status_header(500);
            error_log(sprintf('{%s#%s} API call <%s> failed (status %s: %s)',
                              $this->CI->rodsuser->getUserInfo()['name'],
                              $this->CI->rodsuser->getUserInfo()['zone'],
                              $name,
                              $result->status,
                              $result->status_info));
        } else if ($result->status !== 'ok') {
            set_status_header(400);
            error_log(sprintf('{%s#%s} API call <%s> failed (status %s: %s)',
                              $this->CI->rodsuser->getUserInfo()['name'],
                              $this->CI->rodsuser->getUserInfo()['zone'],
                              $name,
                              $result->status,
                              $result->status_info));
        }
        return $result;
    }
}
