<?php

class Home extends MY_Controller {

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
}
