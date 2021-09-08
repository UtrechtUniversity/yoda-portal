<?php
/**
 * User controller
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2021, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */
class User extends MY_Controller {

    public function callback() {
        $code           = $this->input->get('code', TRUE);
        $tokenUrl       = $this->config->item('oidc_token_uri');
        $callbackUrl    = $this->config->item('oidc_callback_uri');
        $clientId       = $this->config->item('oidc_client_id');'';
        $clientSecret   = $this->config->item('oidc_client_secret');
        $email_field    = $this->config->item('oidc_email_field');
        $publicKey      = $this->config->item('oidc_public_key');
        $CREDS          = base64_encode("$clientId:$clientSecret");

        $formdata = array(
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $callbackUrl
        );

        $options = [
            'http' => [
                'header' => [
                    "Authorization: Basic $CREDS",
                    "Content-Type: application/x-www-form-urlencoded"
                ],
                'method' => 'POST',
                'content' => http_build_query($formdata)
            ]
        ];

        $context = stream_context_create($options);
        $result = file_get_contents($tokenUrl, false, $context);
        $jsonresult = json_decode($result, TRUE);

        // Decode id token.
        list($header, $payload, $signature) = explode(".", $jsonresult['id_token']);
        $plainHeader = json_decode(base64_decode($header), TRUE);
        $plainPayload = json_decode(base64_decode($payload), TRUE);
        $plainSignature = base64_decode(strtr($signature, '-_', '+/'), true);

        //$algorithm = $plainHeader["alg"];
        $algorithm = OPENSSL_ALGO_SHA256;

        // Verify id token.
        $verified = openssl_verify($header.".".$payload, $plainSignature,
                                   base64_decode($publicKey), $algorithm);

        $this->session->unset_userdata('username');
        $this->session->unset_userdata('password');

        $username = $plainPayload[$email_field];
        $password = $jsonresult['access_token'];

        if ($verified == 1 && $this->rodsuser->login($username, $password)) {
            $this->session->set_userdata('username', $username);
            $this->session->set_userdata('password', $password);
            $redirectTarget = $this->session->flashdata('redirect_after_login');

            if ($redirectTarget === false)
                redirect('home');
            else
                redirect($redirectTarget);
        }

        $verified_string = $verified ? 'success' : 'failed';
        error_log("Error during verification/authentication. Id token verified: {$verified_string}, username: {$username}");
        if($verified != 1) {
            error_log("Id token: {$jsonresult['id_token']}");
	}
        $this->session->keep_flashdata('redirect_after_login');
        $this->session->set_flashdata('error', 'Failed to login to Yoda. Please contact a data manager about your account.');
        redirect('user/login');
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
            if (strlen($username) > 64) {
                $loginFailed = true;
                $error = "Login failed. Please check your username and password.";
            } else if ($this->rodsuser->login($username, $password)) {

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
                $error = "Login failed. Please check your username and password.";
            }
        }

        $this->session->keep_flashdata('redirect_after_login');

        // Check whether we were redirected from a failed callback
        $callback_error = $this->session->flashdata('error');
        if (isset($callback_error) && $callback_error !== '') {
            $loginFailed = true;
            $error = $callback_error;
        }

        $viewParams = array(
            'activeModule'  => 'login',
            'scriptIncludes'    => array('js/login.js'),
            'loginFailed'   => $loginFailed,
            'error'     => $error,
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
