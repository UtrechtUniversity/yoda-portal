<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class MY_Controller extends CI_Controller {

	public $data = array();
	public $user = NULL;
	public $header = TRUE;

	/*****
	 * MY_Controller constructor
	 */
	public function __construct() {
		parent::__construct();

		// Make sure we are on a encrypted connection
		//$this->https_it();

		$this->load->config('config');
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
		if (!in_array(uri_string(), array('user/login', '')) && !$this->rodsuser->isLoggedIn())
			redirect('user/login');

		// no caching
		$this->output->set_header('Pragma: no-cache');
		$this->output->set_header('Cache-Control: no-cache, must-revalidate');
		$this->output->set_header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

		// User is logged in. Proceed to application

		// profiler disabled
		$this->output->enable_profiler(FALSE);

		$this->carabiner->css('bootstrap-3.0/bootstrap.min.css');
		$this->carabiner->css('bootstrap-3.0/bootstrap-theme.min.css');
		$this->carabiner->css('layout.css');
		$this->carabiner->css('jqueryui/smoothness/jquery-ui-1.10.3.custom.min.css');

		// load basic js files
		$this->carabiner->js('jquery-ui-1.10.3.custom.min.js');
		$this->carabiner->js('bootstrap-3.0/bootstrap.min.js');
		$this->carabiner->js('jquery.ui.datepicker-nl.js');
		$this->carabiner->js('controllers/main.js');

		// Show header
		$this->data['header'] = $this->header;
	}

	/**
	 * Turns a http adress into the https equivalent.
	 */
	private function https_it()
	{
		// if not https --> redirect to https
		if ($_SERVER["SERVER_PORT"] != 443)
		{
			redirect(str_replace("http://", "https://" , current_url()), "refresh");
		}
	}
}
