<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Reads modules from the modules directory.
 * Uses config 
 */
class Menu {

	private $ci;
	private $modules;
	private $module_configs;
	private $module_dir;

	function __construct() {
		$this->ci =& get_instance();
		$this->module_dir = $_SERVER['DOCUMENT_ROOT'] . "/" . $_SERVER["CI_APPLICATION"] . "/modules2";
		$this->read_modules_from_files();
	}

	/**
	 * Method to get the list of modules prepared for the
	 * menu (i.e. same as used to be in constants.php)
	 * @return 		List of modules prepared for menu
	 */
	public function getModules() {
		return $this->modules;
	}

	/**
	 * Get a list of configurations for each available
	 * module
	 * @return 		Array of configurations for modules
	 */
	public function getModuleConfiguration() {
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
	private function read_modules_from_files() {
		$menu_array = array();
		$modules = @scandir($this->module_dir);
		if($modules && sizeof($modules) > 0) {
			foreach($modules as $module) {
				$f = $this->module_dir . "/" . $module;
				if(is_dir($f) && $module != "." && $module != "..") {
					$conf = $f . "/config/module.php";
					if (is_file($conf)) {
						array_push($menu_array, $this->get_conf_from_file($conf, $module));
					} else {
						array_push($menu_array, $this->guess_conf_from_module($module));
					}
				}
			}
			$this->modules = $this->prepare_yoda_modules($menu_array);
		}

		$this->module_configs = $menu_array;
	}

	/**
	 * Method reads the module configuration file
	 * @param 	$file	Configuration file path
	 * @return 			Module configuration array
	 */
	private function get_conf_from_file($file, $module_name) {
		$module = array();

		// Read config file for module
		require_once($file);
		
		if(!array_key_exists("name", $module))
			$module["name"] = $module_name;
		if(!array_key_exists("label", $module))
			$module["label"] = $this->guess_label_from_module_name($module_name);
		if(!array_key_exists("glyph", $module))
			$module["glyph"] = $this->ci->config->item("default_glyphicon");
		if(!array_key_exists("menu_order", $module))
			$module["menu_order"] = $this->ci->config->item("default_menu_prevalence");
		if(!array_key_exists("hide_menu", $module))
			$module["hide_menu"] = false;
		
		return $module;
	}

	/**
	 * Method that estimates the configuration for a
	 * module if a configuration file is not present
	 * @param 	$module 	Module directory path
	 * @return 				Module configuration array
	 */
	private function guess_conf_from_module($module_name) {
		$module = array(
					"name" => $module_name,
					"label" => $this->guess_label_from_module_name($module_name),
					"glyph" => $this->ci->config->item("default_glyphicon"),
					"menu_order" => $this->ci->config->item("default_menu_prevalence"),
					"hide_menu"	=> false,
				);
		return $module;
	}

	/**
	 * Guesses the label for a module from the module directory name,
	 * by replacing all non-word and non-number characters with a
	 * space and capitalizing each word
	 * @param $module_name 		The modules directory name
	 * @return 					Guessed label for module
	 */
	private function guess_label_from_module_name($module_name) {
		$words = preg_split("/(?=[A-Z\d])|[-_ ]/", $module_name);
		$newWords = array();
		foreach($words as $word) {
			array_push($newWords, ucfirst($word));
		}

		return join(' ', $newWords);
	}

	/**
	 * Method to prepare the configuration array for the yoda
	 * menu as it used to be defined in the constants.php
	 * @param 	$module_list 	(Unsorted) list of modules
	 * @return 					Ordered array of menu items
	 */
	private function prepare_yoda_modules($module_list) {
		$ord_mod_list = $this->sort_by_menu_prevalence($module_list);
		$menu = array();

		foreach($ord_mod_list as $module) {
			if(!$module['hide_menu'])
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
	private function sort_by_menu_prevalence($arr) {
		$prevalence = array();
		foreach($arr as $k => $a) {
			$prevalence[$k] = $a['menu_order'];
		}
		array_multisort($prevalence, SORT_ASC, $arr);
		return $arr;
	}
	
}
