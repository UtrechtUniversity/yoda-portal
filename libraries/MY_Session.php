<?php

/**
 * Extended session class.
 *
 * Overrides the _set_cookie method to make sure that the session cookie is set
 * with HttpOnly enabled.
 */
class MY_Session extends CI_Session {
	function __construct($params = array()) {
		parent::__construct($params);
	}

	/**
	 * Write the session cookie
	 *
	 * @access	public
	 * @return	void
	 */
	function _set_cookie($cookie_data = NULL)
	{
		if (is_null($cookie_data))
		{
			$cookie_data = $this->userdata;
		}

		// Serialize the userdata for the cookie
		$cookie_data = $this->_serialize($cookie_data);

		if ($this->sess_encrypt_cookie == TRUE)
		{
			$cookie_data = $this->CI->encrypt->encode($cookie_data);
		}

		$cookie_data .= hash_hmac('sha1', $cookie_data, $this->encryption_key);

		$expire = ($this->sess_expire_on_close === TRUE) ? 0 : $this->sess_expiration + time();

		// Set the cookie
		setcookie(
			$this->sess_cookie_name,
			$cookie_data,
			$expire,
			$this->cookie_path,
			$this->cookie_domain,
			$this->cookie_secure,
			true // <-- HttpOnly.
		);
	}
}
