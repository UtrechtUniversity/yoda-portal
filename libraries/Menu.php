<?php

/**
 * Reads modules from the modules directory.
 * Uses config 
 */
class Menu {

	private $ci;
	private $modules;
	private $module_configs;
	private static $module_dir;

	function __construct() {
		$this->ci =& get_instance();
		$this->module_dir = $_SERVER['DOCUMENT_ROOT'] . "/" . $_SERVER["CI_APPLICATION"] . "/modules";
		$this->read_modules_from_files();
	}

	/**
	 * Method to get the list of modules prepared for the
	 * menu (i.e. same as used to be in constants.php)
	 * @return 		List of modules prepared for menu
	 */
	public function getModules()
	{
		return $this->modules;
	}

	/**
	 * Get a list of configurations for each available
	 * module
	 * @return 		Array of configurations for modules
	 */
	public function getModuleConfiguration()
	{
		return $this->module_configs;
	}

	/**
	 * Reads the config files from all modules
	 * in the modules directory
	 * Adds modules to array
	 * If no config file present for module, a smart
	 * guess is made
	 * @return 		array of module configurations
	 */
	private function read_modules_from_files()
	{
		$menu_array = array();
		$modules = scandir($this->module_dir);
		foreach($modules as $module){
			$f = $this->module_dir . "/" . $module;
			if(is_dir($f) && $module != "." && $module != "..")
			{
				$conf = $f . "/config/module.php";
				if (is_file($conf))
				{
					array_push($menu_array, $this->get_conf_from_file($conf));
				} else {
					array_push($menu_array, $this->guess_conf_from_module($f));
				}
			}
		}

		$this->module_configs = $menu_array;
		$this->modules = $this->prepare_yoda_modules($menu_array);
	}

	/**
	 * Method reads the module configuration file
	 * @param 	$file	Configuration file path
	 * @return 			Module configuration array
	 */
	private function get_conf_from_file($file)
	{
		$module = array();
		require_once($file);
		return $module;
	}

	/**
	 * Method that estimates the configuration for a
	 * module if a configuration file is not present
	 * @param 	$module 	Module directory path
	 * @return 				Module configuration array
	 */
	private function guess_conf_from_module($module)
	{

		return "";
	}

	/**
	 * Method to prepare the configuration array for the yoda
	 * menu as it used to be defined in the constants.php
	 * @param 	$module_list 	(Unsorted) list of modules
	 * @return 					Ordered array of menu items
	 */
	private function prepare_yoda_modules($module_list)
	{
		$ord_mod_list = $this->sort_by_menu_prevalence($module_list);
		$menu = array();

		foreach($ord_mod_list as $module)
		{
			$menu[$module['name']] = array(
					"label" => $module["label"],
					"icon_class" => "glyphicon glyphicon-" . $module['glyph']
				);
		}

		return $menu;
	}

	/**
	 * Sort an array of menu entries for modules
	 * by their given menu prevalence
	 * @param 		Array of menu entries
	 * @return 		Param sorted by menu prevalence
	 */
	private function sort_by_menu_prevalence($arr)
	{
		$prevalence = array();
		foreach($arr as $k => $a)
		{
			$prevalence[$k] = $a['menu_order'];
		}
		array_multisort($prevalence, SORT_ASC, $arr);
		return $arr;
	}


	
}
