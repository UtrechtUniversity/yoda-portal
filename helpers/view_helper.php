<?php
/**
 * Load view helper
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2019, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */

/**
 * Load a view.
 *
 * @param $name         Name of the view
 * @param array $params Parameters for view
 * @return bool
 */
function loadView($name, $params = array())
{
    $CI = get_instance();

    $defaultParams = array(
        'style_includes' => array(),
        'script_includes' => array(),
        'user' => array(
            'username' => $CI->rodsuser->getUsername(),
        ),
        'activeModule' => 'login',
    );
    $params = array_merge($defaultParams, $params);

    $CI->load->view('common/start', $params);
    $CI->load->view($name, $params);
    $CI->load->view('common/end', $params);

    return true;
}
