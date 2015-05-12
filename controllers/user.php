<?php

class User extends CI_Controller {

	public function login() {
		$this->session->unset_userdata('username');
		$this->session->unset_userdata('password');

		$username = $this->input->post('username');
		$password = $this->input->post('password');

		$loginFailed = false;

		if (
			   isset($username)
			&& isset($password)
			&&       $username !== false
			&&       $password !== false
			) {
			if ($this->rodsuser->login($username, $password)) {
				$this->session->set_userdata('username', $username);
				$this->session->set_userdata('password', $password);
				// TODO: Set iRODS temporary password instead.
				redirect('home');
			} else {
				$loginFailed = true;
			}
		}
		$this->load->view('common-start', array(
			 'styleIncludes' => array(),
			'scriptIncludes' => array('js/login.js'),
			'user' => array(
				'username' => $this->rodsuser->getUsername(),
			),
			'loginFailed'  => $loginFailed,
			'activeModule' => 'login',
		));
		$this->load->view('user_login', array(
		));
		$this->load->view('common-end');
	}

	public function logout() {
		$this->session->unset_userdata('username');
		$this->session->unset_userdata('password');
		redirect('home');
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
