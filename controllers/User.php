<?php
/**
 * User controller
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2018, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */
class User extends MY_Controller {

    public function login_oidc()
    {
	$clientId 	= $this->config->item('oidc_clientId');
	$redirectUri 	= $this->config->item('oidc_callbackUrl');
	$authUrl 	= $this->config->item('oidc_authUrl') . "?response_type=code&client_id={$clientId}&redirect_uri={$redirectUri}";

        // Redirect logged in users to home.
        if ($this->rodsuser->isLoggedIn()) {
            redirect('home');
        }

	redirect($authUrl);
    }

    public function callback() {
	$code 		= $this->input->get('code', TRUE);
	$tokenUrl 	= $this->config->item('oidc_tokenUrl');
	$callbackUrl 	= $this->config->item('oidc_callbackUrl');
	$clientId 	= $this->config->item('oidc_clientId');'';
	$clientSecret 	= $this->config->item('oidc_clientSecret');'';
	$grant_type 	= 'autorization_code';
	$CREDS 		= base64_encode("$clientId:$clientSecret");

	$formdata = array(
		'grant_type' => 'authorization_code', 
		'code' => $code, 
		'redirect_uri' => $callbackUrl
	);

	$options = [
		'http' => [
			  'header' => [ "Authorization: Basic $CREDS"
			      	      , "Content-Type: application/x-www-form-urlencoded"
				      ]
			, 'method' => 'POST'
			, 'content' => http_build_query($formdata)
			]
	];

	$context = stream_context_create($options);
	$result = file_get_contents($tokenUrl, false, $context);
	$jsonresult = json_decode($result, TRUE);

	$claimElement = explode('.', $jsonresult['id_token'])[1];
	$claimData = json_decode(base64_decode($claimElement), TRUE);

        $this->session->unset_userdata('username');
	$this->session->unset_userdata('password');

	$username = $claimData['email'];
	$password = $jsonresult['access_token'];
	
	$loginFailed = false;
	$loginSuccess =$this->rodsuser->login($username, $password);
        if ($loginSuccess) {
	    $this->session->set_userdata('username', $username);
	    $this->session->set_userdata('password', $password);

            $redirectTarget = $this->session->flashdata('redirect_after_login');

                if ($redirectTarget === false)
                    redirect('home');
                else
                    redirect($redirectTarget);
        } 
	else {
            $loginFailed = true;
        }

        $this->session->keep_flashdata('redirect_after_login');

        $viewParams = array(
            'activeModule' => 'login',
            'scriptIncludes' => array('js/login.js'),
            'loginFailed'  => $loginFailed,
        );

	$viewParams = array( 'loginSuccess' => false );
	loadView('home', $viewParams);

    }

    public function login() { 
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
