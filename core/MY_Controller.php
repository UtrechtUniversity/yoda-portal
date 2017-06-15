<?php

class MY_Controller extends CI_Controller {

	public $data = array();
	public $user = NULL;
	public $header = TRUE;

	/**
	 * MY_Controller constructor.
	 */
	public function __construct() {
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

		$this->load->model('rodsuser');

		if (
			   $this->session->userdata('username') !== false
			&& $this->session->userdata('password') !== false
		) {
			$this->rodsuser->getRodsAccount(
				$this->session->userdata('username'),
				$this->session->userdata('password')
			);
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

        // Load assets versioning for browser caching
        $assetsVersion = $this->config->item('assetsVersion');
        //$this->data['assetsVersion'] = $assetsVersion;
        define("ASSETS_VERSION", $assetsVersion);

		# XXX: FIXME: TEMPORARY HACK.
		# Reloading the config is apparently required for HMVC modules that have their own config directory.
		# However, reloading the config in the main application causes some strange problems.
		#
		# 1) Find out if there's a better method for finding out whether the current controller is a module or a main controller.
		# 2) Figure out why reloading the config is needed (is this an issue with the HMVC plugin or how we implement it?)
		#
		# Reload the config if the current controller resides in the modules directory.
		$reflector = new ReflectionClass($this);
		if (strstr($reflector->getFilename(), '/modules/') !== false)
			$this->load->config('config');

		// Require a valid login for all pages except Home and User/Login.
		if (!in_array(uri_string(), array('user/login', '')) && !$this->rodsuser->isLoggedIn()) {
			$this->session->set_flashdata('redirect_after_login', uri_string());
			redirect('user/login', 'refresh');
		}

		// Disable caching.
		$this->output->set_header('Pragma: no-cache');
		$this->output->set_header('Cache-Control: no-cache, must-revalidate');
		$this->output->set_header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

		// Carabiner css and js, as used by the intake module.
		// TODO: Either move this to the intake module or start using it in other modules.
		$this->carabiner->css('bootstrap-3.0/bootstrap.min.css');
		$this->carabiner->css('bootstrap-3.0/bootstrap-theme.min.css');
		$this->carabiner->css('layout.css');
		$this->carabiner->css('jqueryui/smoothness/jquery-ui-1.10.3.custom.min.css');
		$this->carabiner->js('jquery-ui-1.10.3.custom.min.js');
		$this->carabiner->js('bootstrap-3.0/bootstrap.min.js');
		$this->carabiner->js('jquery.ui.datepicker-nl.js');
		$this->carabiner->js('controllers/main.js');
		// Show header (applies only to the intake module).
		$this->data['header'] = $this->header;
	}
}
