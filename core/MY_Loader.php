<?php
(defined('BASEPATH')) or exit('No direct script access allowed');

/* load the HMVC_Loader class */
require APPPATH . 'third_party/HMVC/Loader.php';

class MY_Loader extends HMVC_Loader {

    function view($view, $vars = array(), $return = FALSE)
    {
        if ($view == 'common-start') {
            $session = $this->_ci_get_component('session');

            $messageType = $session->flashdata('messageType');
            $messageText = $session->flashdata('messageText');
            $vars['messageType'] = $messageType;
            $vars['messageText'] = $messageText;
        }

        return parent::view($view, $vars, $return);
    }

}
