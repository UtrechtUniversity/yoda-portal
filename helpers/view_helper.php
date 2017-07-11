<?php
/**
 * Load view helper
 * @param $name
 * @param array $params
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