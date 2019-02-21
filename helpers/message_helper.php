<?php
/**
 * Message helper
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2019, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */

/**
 * Set flash message in frontoffice.
 *
 * @param $type Message type
 * @param $text Message text
 * @return bool
 */
function setMessage($type, $text)
{
    $CI = get_instance();

    if ($type == 'error') {
        $type = 'danger';
    }
    $CI->session->set_flashdata('messageType', $type);
    $CI->session->set_flashdata('messageText', $text);

    return true;
}
