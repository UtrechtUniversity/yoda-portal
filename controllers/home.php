<?php

class Home extends MY_Controller {

	public function index() {
		$mods = $this->split_modules($this->menu->getModules());

		$this->load->view(
			'common-start', 
			array(
					'style_includes' => array(),
					'script_includes' => array(),
					'user' => array(
						'username' => $this->rodsuser->getUsername(),
					),
					'activeModule' => 'login',
					'modules' => $mods,
				)
			);
		
		$this->load->view('home_index');
		$this->load->view('common-end');
	}

	/**
	 * Recursive definition to split an array of
	 * modules into an array of arrays of modules,
	 * where each array of modules defines a single
	 * row
	 * @param 	$modules 	Array of items
	 * @return 				Array of array of items
	 */
	function split_modules($modules)
	{
		$result = array();
		$mod_size = sizeof($modules);
		
		if($mod_size < 5 || $mod_size == 6)
			// One row is enough
			array_push($result, $modules);
		else {
			// Split intelligently in multiple rows
			$half = round(sizeof($modules) / 2);
			$result = $this->split_modules(array_slice($modules, 0, $half));
			$result = array_merge($result, $this->split_modules(array_slice($modules,$half)));
		}

		return $result;
	}
}
