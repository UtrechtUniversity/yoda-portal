<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/*
|--------------------------------------------------------------------------
| File and Directory Modes
|--------------------------------------------------------------------------
|
| These prefs are used when checking and setting modes when working
| with the file system.  The defaults are fine on servers with proper
| security, but you may wish (or even need) to change the values in
| certain environments (Apache running a separate process for each
| user, PHP under CGI with Apache suEXEC, etc.).  Octal values should
| always be used to set the mode correctly.
|
*/
define('FILE_READ_MODE', 0644);
define('FILE_WRITE_MODE', 0666);
define('DIR_READ_MODE', 0755);
define('DIR_WRITE_MODE', 0777);

/*
|--------------------------------------------------------------------------
| File Stream Modes
|--------------------------------------------------------------------------
|
| These modes are used when working with fopen()/popen()
|
*/

define('FOPEN_READ',							'rb');
define('FOPEN_READ_WRITE',						'r+b');
define('FOPEN_WRITE_CREATE_DESTRUCTIVE',		'wb'); // truncates existing file data, use with care
define('FOPEN_READ_WRITE_CREATE_DESTRUCTIVE',	'w+b'); // truncates existing file data, use with care
define('FOPEN_WRITE_CREATE',					'ab');
define('FOPEN_READ_WRITE_CREATE',				'a+b');
define('FOPEN_WRITE_CREATE_STRICT',				'xb');
define('FOPEN_READ_WRITE_CREATE_STRICT',		'x+b');

// TODO: Read the modules directory or query the HMVC plugin to get a list of modules.
$YODA_MODULES = array(
	'intake' => array(
		'label'      => 'Intake Area',
		'icon_class' => 'glyphicon glyphicon-saved',
	),
	'intake/reports' => array(
		'label'      => 'Reports',
		'icon_class' => 'glyphicon glyphicon-stats'
	),
	'group-manager' => array(
		'label'      => 'Group Manager',
		'icon_class' => 'glyphicon glyphicon-user'
	),
	'group-manager2' => array(
		'label'      => 'Group Manager',
		'icon_class' => 'glyphicon glyphicon-user'
	),
	'group-manager3' => array(
		'label'      => 'Group Manager',
		'icon_class' => 'glyphicon glyphicon-user'
	),
	// 'group-manager4' => array(
	// 	'label'      => 'Group Manager',
	// 	'icon_class' => 'glyphicon glyphicon-user'
	// ),
	// 'group-manager5' => array(
	// 	'label'      => 'Group Manager',
	// 	'icon_class' => 'glyphicon glyphicon-user'
	// ),
	// 'group-manager6' => array(
	// 	'label'      => 'Group Manager',
	// 	'icon_class' => 'glyphicon glyphicon-user'
	// ),
	// 'group-manager7' => array(
	// 	'label'      => 'Group Manager',
	// 	'icon_class' => 'glyphicon glyphicon-user'
	// ),
	// 'group-manager8' => array(
	// 	'label'      => 'Group Manager',
	// 	'icon_class' => 'glyphicon glyphicon-user'
	// ),
	// 'group-manage9' => array(
	// 	'label'      => 'Group Manager',
	// 	'icon_class' => 'glyphicon glyphicon-user'
	// ),
	// 'group-manager10' => array(
	// 	'label'      => 'Group Manager',
	// 	'icon_class' => 'glyphicon glyphicon-user'
	// ),
);

$config['YODA_MODULES'] = $YODA_MODULES;

/* End of file constants.php */
/* Location: ./application/config/constants.php */
