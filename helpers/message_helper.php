<?php
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