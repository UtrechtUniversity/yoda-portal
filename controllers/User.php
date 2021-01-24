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
	$scopes		= $this->config->item('oidc_scopes');
	$acr		= $this->config->item('oidc_acrValues');
	$authUrl 	= $this->config->item('oidc_authUrl') . "?response_type=code&client_id={$clientId}&redirect_uri={$redirectUri}&scope={$scopes}&acr_values={$acr}";

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
	$clientSecret 	= $this->config->item('oidc_clientSecret');
	$email_field	= $this->config->item('oidc_emailField');
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

	$username = $claimData[ $email_field ];
	$password = $jsonresult['access_token'];

        if ($this->rodsuser->login($username, $password)) {
	    $this->session->set_userdata('username', $username);
	    $this->session->set_userdata('password', $password);
            $redirectTarget = $this->session->flashdata('redirect_after_login');

                if ($redirectTarget === false)
                    redirect('home');
                else
                    redirect($redirectTarget);
        } 

        $this->session->keep_flashdata('redirect_after_login');

	//$viewParams = array( 'loginSuccess' => false );
	$this->session->set_flashdata('error', 'Failed to login to Yoda. Please contact a data manager about your account.');
	redirect('user/login');
    }

    public function login() { 
	if ($this->rodsuser->isLoggedIn()) {
            redirect('home');
        }
	
	$authUrl 	= '';
	$oidc_active	= $this->config->item('oidc_active');
	$oidc_signin_text = '';

	if($oidc_active) {
		$clientId 	= $this->config->item('oidc_clientId');
		$redirectUri 	= $this->config->item('oidc_callbackUrl');
		$scopes		= $this->config->item('oidc_scopes');
		$acr		= $this->config->item('oidc_acrValues');
		$authUrl 	= $this->config->item('oidc_authUrl') . "?response_type=code&client_id={$clientId}&redirect_uri={$redirectUri}&scope={$scopes}&acr_values={$acr}";
		$oidc_signin_text = 'Sign in with Solis ID';
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

                redirect('home', 'refresh');
                $redirectTarget = $this->session->flashdata('redirect_after_login');

                if ($redirectTarget === false)
                    redirect('home', 'refresh');
                else
                    redirect($redirectTarget);
            } else {
                $loginFailed = true;
            }
        }

        $this->session->keep_flashdata('redirect_after_login');
	
	$error = $this->session->flashdata('error');
	if( isset( $error ) ) {
	    $loginFailed = true;
	}

        $viewParams = array(
            'activeModule' 	=> 'login',
            'scriptIncludes' 	=> array('js/login.js'),
            'loginFailed'  	=> $loginFailed,
	    'error'		=> $error,
	    'authUrl' 		=> $authUrl,
	    'oidc_active' 	=> $oidc_active, 
	    'oidc_signin_text'  => $oidc_signin_text,
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
