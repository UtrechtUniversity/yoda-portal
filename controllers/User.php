<?php
/**
 * User controller
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2018, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */
class User extends MY_Controller {

    public function login()
    {
        // Redirect logged in users to home.
        if ($this->rodsuser->isLoggedIn()) {
            redirect('home');
        }

        $this->session->unset_userdata('username');
        $this->session->unset_userdata('password');

        $username = $this->input->post('username');
        $password = $this->input->post('password');

        $loginFailed = false;

        if (isset($username) && isset($password) && $username !== false && $password !== false) {
            if ($this->rodsuser->login($username, $password)) {
                $this->session->set_userdata('username', $username);
                $this->session->set_userdata('password', $password);
                // TODO: Set iRODS temporary password instead.

                $redirectTarget = $this->session->flashdata('redirect_after_login');

                if ($redirectTarget === false)
                    redirect('home');
                else
                    redirect($redirectTarget);
            } else {
                $loginFailed = true;
            }
        }

        $this->session->keep_flashdata('redirect_after_login');

        $viewParams = array(
            'activeModule' => 'login',
            'scriptIncludes' => array('js/login.js'),
            'loginFailed'  => $loginFailed,
        );

        loadView('user/login', $viewParams);
    }

    public function logout() {
        $this->session->sess_destroy();
        redirect('home');
    }

    public function __construct() {
        parent::__construct();
    }
}
