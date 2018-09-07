<?php
/**
 * Prods library
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2018, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */
// This path is relative to the application's root directory.
$IRODS_PHP_ROOT =
    isset($_SERVER['YODA_IRODS_PHP_ROOT'])
        ? $_SERVER['YODA_IRODS_PHP_ROOT']
        : '../irods-php';

require_once($IRODS_PHP_ROOT . '/prods/src/Prods.inc.php');

class Prods {
}