How to prepare a new module for the yoda portal
===============================================

This documentation is a work in progress.

For the Yoda Portal, the CodeIgniter framework was extended with the [HMVC](https://bitbucket.org/wiredesignz/codeigniter-modular-extensions-hmvc) (Hierarchival Model View Controller) Plugin. This plugin allows building a modular website using the CodeIgniter framework.

As the Yoda Portal creates menu entries for each of the modules, the Yoda portal supports adding of modules as well. 

Preparing the Module
--------------------

Modules in the Yoda Portal follow the specification from the [HMVC package plugin](https://bitbucket.org/wiredesignz/codeigniter-modular-extensions-hmvc).
In addition, menu configuration settings have to be provided in a seperate **module.php** file inside the config directory of the module.

### The **module.php** file
**Location**: <module>/config/module.php

**Contents:**

	$module['name'] 		= "module-name";
	$module['label'] 		= "Module Label";
	$module['glyph'] 		= "user";
	$module['menu_order'] 	= 10;

**Content Clarification:**

The file defines a php array `module`, with four keys:

* **name** The name of the module, such as the directory it is places in should be called and such as the module appears in the url. This name should not contain spaces and should preferably be all lower case
* **label** The name of the module such as it should appear in the menu
* **glyph** The name of the [bootstrap glyph](http://getbootstrap.com/components/) that should be displayed next to the component link, without the leading "glyphicon glyyphicon-" part. For example, the glyph for user is `glyphicon glyphicon-user` so the value of the `glyph`-key should be *user*
* **menu_order** The lower this number, the more it appears to the left of the menu. All modules are sorted based on this number.

### Routing
Include your routing in the modules routing.php file (located in **config/routes.php**) rather than in the Yoda Portal or CodeIgniter application. Make sure that the uri defined in your **$module['name']** redirects to the main router of your module. For example:

	$route['module-name'] = "module-name/module_router";

Menu items for your module will refer to the module name, so it is important to resolve this uri in your routing table.

### Helping your user
An example file of the config/module.php file is provided in this directory (with the same examples used as above, look for the **module.php** file). This file is especially
useful because of its content description and user guide, so copy the file to your own module.

Make sure to add the following line to your .gitignore:

	/config/module_local.php

This way, your settings can be overrided.

Because your routes.php contains a reference to how you called this directory, you have to make sure the person who adds this module to the Yoda Portal
knows to name the directory the same way. Therefor, provide an example call to add the module to the portal, which includes the git repositry and the intended name of the directory. Anybody should be able to just copy this line and have it work (see **adding the Module** for examples).

Adding the Module
-----------------
To add the module, open the shell in the Yoda Portal root. Find the git URL of the module and run the **tools/add-module.sh** script, with the git url as the first argument, and the name defined in $module["name"] as the second:

	tools/add-module.sh https://github.com/user/yoda-portal-module.git module-name

Removing the module can be done with the **rm_module.sh** script:

	tools/rm-module.sh module-name


AUTHORS
-------

- [Jan de Mooij](https://github.com/AJdeMooij)