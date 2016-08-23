<?php

/**
 * \brief User model.
 */
class RodsUser extends CI_Model {

	protected $_username;
	protected $_userInfo;
	protected $_rodsAccount;

	public function __construct () {
		parent::__construct();
		$this->load->library('prods');
	}

	public function getUsername() {
		return $this->_username;
	}

	public function getUserInfo() {
		return $this->_userInfo;
	}

	/**
	 * \brief Attempt to get a RODSAccount object.
	 *
	 * \param username overrides a username in session storage
	 * \param password overrides a password in session storage
	 *
	 * \return 
	 */
	public function getRodsAccount($username = null, $password = null) {
		if (!isset($this->_rodsAccount)) {
			if (isset($username) && isset($password)) {
				try {
					$this->_rodsAccount = new RODSAccount(
						$this->config->item('rodsServerAddress'),
						$this->config->item('rodsServerPort'),
						$username,
						$password,
						$this->config->item('rodsServerZone'),
						$this->config->item('rodsDefaultResource'),
						$this->config->item('rodsAuthType')
					);
					$this->_userInfo = $this->_rodsAccount->getUserInfo();
					$this->_username = $username;
				} catch (Exception $ex) {
					// Assume the user is not logged in or the credentials are incorrect.
					$this->_rodsAccount = null;
				}
			}
		}

		return $this->_rodsAccount;
	}

	public function login($username, $password) {
		$account = $this->getRodsAccount($username, $password);
		return isset($account);
	}

	public function isLoggedIn() {
		$account = $this->getRodsAccount();
		return isset($account);
	}
}
