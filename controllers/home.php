<?php

class Home extends CI_Controller {

	public function index() {
		$this->load->view('common-start', array(
			 'style_includes' => array(),
			'script_includes' => array(),
			'user' => array(
				'username' => $this->rodsuser->getUsername(),
			),
			'activeModule' => 'login',
		));
		$this->load->view('home_index');
		$this->load->view('common-end');
	}

	public function __construct() {
		parent::__construct();

		$this->load->library('session');
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
	}
}
