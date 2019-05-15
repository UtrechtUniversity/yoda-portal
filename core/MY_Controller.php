<?php (defined('BASEPATH')) OR exit('No direct script access allowed');

class MY_Controller extends CI_Controller {

    public $data = array();
    public $user = NULL;
    public $header = TRUE;

    /**
     * MY_Controller constructor.
     */
    public function __construct()
    {
        parent::__construct();

        // When not in a dev environment, enforce stricter security.
        if (ENVIRONMENT !== 'development') {

            if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')) {
                // Remind the browser that it should only attempt to reach us over HTTPS.
                // TODO: Determine a good value for 'max-age', perhaps allow setting it in config_local?
                header('Strict-Transport-Security: max-age=60');
            } else {
                // Redirect to HTTPS.
                redirect(str_replace("http://", "https://" , current_url()), "refresh");
            }
        }

        $username = $this->session->userdata('username');
        $password = $this->session->userdata('password');

        if (!empty($username) && !empty($password) !== false) {
            $this->rodsuser->getRodsAccount($username, $password);
        }

        // Messages & AJAX
        $messageType = $this->session->flashdata('messageType');
        $messageText = $this->session->flashdata('messageText');
        if ($messageText) {
            if ($this->input->is_ajax_request()) {
                $this->session->keep_flashdata('messageType');
                $this->session->keep_flashdata('messageText');
            }
        }

        // Load Yoda version.
        $yodaVersion = $this->config->item('yodaVersion');
        define("YODA_VERSION", $yodaVersion);

        // Load assets version for browser caching.
        $assetsVersion = $this->config->item('assetsVersion');
        define("ASSETS_VERSION", $assetsVersion);

        // Require a valid login for all pages except Home and User/Login.
        if (!in_array(uri_string(), array('user/login', '')) && !$this->rodsuser->isLoggedIn()) {
            $this->session->set_flashdata('redirect_after_login', uri_string());
            redirect('user/login', 'refresh');
        }

        // Disable caching.
        $this->output->set_header('Pragma: no-cache');
        $this->output->set_header('Cache-Control: no-cache, must-revalidate');
        $this->output->set_header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
    }
}
