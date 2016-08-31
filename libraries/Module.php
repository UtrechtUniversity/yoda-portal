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
        include realpath($params[0] . "/../config/module.php");

        $controller = $this->getDefaultController($params[0], $module['name']);

        $module['path'] = sprintf("%s/%s", $module['name'], $controller);
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
     * Method to read the routes file of a module and extract the
     * default controller from there
     * @param path      Module path to controller
     * @param module    Name of the module
     * @return string   Default controller name or empty string if
     *                  no default controller is defined
     */
    private function getDefaultController($path, $module) {
        $route = array();
        include realpath($path . "/../config/routes.php");
        return array_key_exists('default_controller', $route) ? $route["default_controller"] : '';
    }
}