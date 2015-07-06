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
