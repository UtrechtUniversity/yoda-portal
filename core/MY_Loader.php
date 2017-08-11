<?php (defined('BASEPATH')) OR exit('No direct script access allowed');

/* load the MX_Loader class */
require APPPATH."third_party/MX/Loader.php";

class MY_Loader extends MX_Loader {

    function view($view, $vars = array(), $return = FALSE)
    {
        if ($view == 'common/start') {
            $session = $this->_ci_get_component('session');
            $messageType = $session->flashdata('messageType');
            $messageText = $session->flashdata('messageText');
            $vars['messageType'] = $messageType;
            $vars['messageText'] = $messageText;
        }

        return parent::view($view, $vars, $return);
    }
}