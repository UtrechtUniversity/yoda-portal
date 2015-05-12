<?php

// This path is relative to the application's root directory.
$IRODS_PHP_ROOT =
	isset($_SERVER['YODA_IRODS_PHP_ROOT'])
		? $_SERVER['YODA_IRODS_PHP_ROOT']
		: '../irods-php';

require_once($IRODS_PHP_ROOT . '/prods/src/Prods.inc.php');

class Prods {
}
