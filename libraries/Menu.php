<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/**
 * Menu library
 *
 * Reads modules from the modules directory.
 * Uses config
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2018, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */
class Menu {

    private $ci;
    private $modules;
    private $moduleConfigs;
    private $moduleDir;

    function __construct() {
        $this->ci =& get_instance();
        $this->moduleDir = realpath(dirname(__FILE__) . "/../modules");
        $this->readModulesFromFiles();
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
        return $this->moduleConfigs;
    }

    /**
     * Reads the config files from all modules
     * in the modules directory
     * Adds modules to array
     * If no config file present for module, a smart
     * guess is made
     * @return 		array of module configurations
     */
    private function readModulesFromFiles() {
        $menuArray = array();
        $modules = @scandir($this->moduleDir);
        if($modules && sizeof($modules) > 0) {
            foreach($modules as $module) {
                $f = $this->moduleDir . "/" . $module;
                if(is_dir($f) && $module != "." && $module != "..") {
                    $conf = $f . "/config/module.php";
                    if (is_file($conf)) {
                        array_push($menuArray, $this->getConfFromFile($conf, $module));
                    } else {
                        array_push($menuArray, $this->guessConfFromModule($module));
                    }
                }
            }
            $this->modules = $this->prepareYodaModules($menuArray);
        }

        $this->moduleConfigs = $menuArray;
    }

    /**
     * Method reads the module configuration file
     * @param 	$file	Configuration file path
     * @return 			Module configuration array
     */
    private function getConfFromFile($file, $moduleName) {
        $module = array();

        // Read config file for module
        require_once($file);

        if(!array_key_exists("name", $module))
            $module["name"] = $moduleName;
        if(!array_key_exists("label", $module))
            $module["label"] = $this->guessLabelFromModuleName($moduleName);
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
    private function guessConfFromModule($moduleName) {
        $module = array(
            "name" => $moduleName,
            "label" => $this->guessLabelFromModuleName($moduleName),
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
     * @param $moduleName 		The modules directory name
     * @return 					Guessed label for module
     */
    private function guessLabelFromModuleName($moduleName) {
        $words = preg_split("/(?=[A-Z\d])|[-_ ]/", $moduleName);
        $newWords = array();
        foreach($words as $word) {
            array_push($newWords, ucfirst($word));
        }

        return join(' ', $newWords);
    }

    /**
     * Method to prepare the configuration array for the yoda
     * menu as it used to be defined in the constants.php
     * @param 	$moduleList 	(Unsorted) list of modules
     * @return 					Ordered array of menu items
     */
    private function prepareYodaModules($moduleList) {
        $orderedModulesList = $this->sortByMenuPrevalence($moduleList);
        $menu = array();

        foreach($orderedModulesList as $module) {
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
    private function sortByMenuPrevalence($arr) {
        $prevalence = array();
        foreach($arr as $k => $a) {
            $prevalence[$k] = $a['menu_order'];
        }
        array_multisort($prevalence, SORT_ASC, $arr);
        return $arr;
    }
}