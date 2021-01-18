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

        // Redirect to HTTPS.
        if (empty($_SERVER['HTTPS'])) {
            redirect(str_replace("http://", "https://" , current_url()), "refresh");
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
        $yodaCommit = $this->config->item('yodaCommit');
        define("YODA_COMMIT", $yodaCommit);

        // Load assets version for browser caching.
        $assetsVersion = $this->config->item('assetsVersion');
        define("ASSETS_VERSION", $assetsVersion);

        // Require a valid login for all pages except Home and User/Login.
        if (!in_array(uri_string(), array('user/login', 'user/login_oidc', 'user/callback', '')) && !$this->rodsuser->isLoggedIn()) {
            $this->session->set_flashdata('redirect_after_login', uri_string());
            redirect('user/login', 'refresh');
        }

        // Disable caching.
        $this->output->set_header('Pragma: no-cache');
        $this->output->set_header('Cache-Control: no-cache, must-revalidate');
        $this->output->set_header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
    }
}
