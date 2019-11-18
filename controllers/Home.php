<?php
/**
 * Home controller
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2018, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */
class Home extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->library('api');
    }

    public function index()
    {
        $mods = $this->splitModules($this->menu->getModules());
        $viewParams = array(
            'activeModule' => 'login',
            'modules' => $mods,
        );

        loadView('home', $viewParams);
    }

    /**
     * Recursive definition to split an array of
     * modules into an array of arrays of modules,
     * where each array of modules defines a single
     * row
     * @param 	$modules 	Array of items
     * @return 				Array of array of items
     */
    private function splitModules($modules)
    {
        $result = array();
        $mod_size = sizeof($modules);

        if($mod_size < 5 || $mod_size == 6)
            // One row is enough
            array_push($result, $modules);
        else {
            // Split intelligently in multiple rows
            $half = round(sizeof($modules) / 2);
            $result = $this->splitModules(array_slice($modules, 0, $half));
            $result = array_merge($result, $this->splitModules(array_slice($modules,$half)));
        }

        return $result;
    }

    public function apicall($name=null) {
        if ($this->input->server('REQUEST_METHOD') !== 'POST') {
            header('Allow: POST');
            set_status_header(405);
            echo 'Method not allowed';
            exit;
        }
        $input = $this->input->post('data');
        if ($input === null)
            $input = '{}';

        $result = $this->api->call($name, $input);

        $this->output->set_content_type('application/json')
                     ->set_output(json_encode($result));
    }
}
