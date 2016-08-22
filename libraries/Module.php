<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Module {

	private $module;

	/**
	 * Constructs new module library
	 * Reads config from config/module.php
     *
     * To load this library, call it from a controller inside your module as follows:
     * $this->load->library('module', array(__DIR__));
	 */
	public function __construct($params) {
        if(sizeof($params) === 0) return;
		$module = array();
        include $params[0] . "/../config/module.php";
        $module['path'] = sprintf("%s/intake", $module['name']);
        $module['basepath'] = sprintf("%s%s", base_url(), $module['name']);
        $this->module = (object) $module;
    }

    /**
     * Get the module base url
     * @return relative url to module base
     */
    public function getModuleBase() {
        return site_url($this->module->name);
    }

    /**
     * Get the object containing module information
     * @return object with module information as provided
     * 			in config/module.php
     */
    public function getModule() {
    	return $this->module;
    }

    /**
     * Get the module name as provided in config/module.php
     * @return module name
     */
    public function name() {
    	return $this->module->name;
    }

    /**
     * Method that generates a url that points to the current study if one
     * is provided, and to the modules entry point otherwise
     * @param $studyID (optional)       The identifying name of the study 
     *                                  that should be redirected to.
     *                                  The first of the valid studies
     *                                  is used if not provided
     * @param $foldername (optional) 	The name of the folder in the study
     * @return  A relative URL that points back to the index of this
     *          module and to a valid study, if one is available
     */
    private function getRedirect($studyID = '', $foldername = '') {
        $segments = array($this->name(), "intake", "index");
        if(!empty($studyID)) {
            // $url .= "/" . ($studyID ? $studyID : $this->studies[0]);
            array_push($studyID);
            if(!empty($foldername)) {
            	array_push($foldername);
            }
        }
        return site_url($segments);
    }
}