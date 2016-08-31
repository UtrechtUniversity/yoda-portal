How to prepare a new module for the yoda portal
===============================================

This documentation is a work in progress.

For the Yoda Portal, the CodeIgniter framework was extended with the [HMVC](https://bitbucket.org/wiredesignz/codeigniter-modular-extensions-hmvc) (Hierarchival Model View Controller) Plugin. This plugin allows building a modular website using the CodeIgniter framework.

To add a new module to the CodeIgniter, a new directory should be created in the `modules` directory, with the name of the module. YoDa handles creating menu entries for this module automatically, but this can be tweaked with the right configuration files.

Structure
-----------
CodeIgniter HMVC modules have largely the same structure as CodeIgniter applications, meaning they can have controllers, models, views, libraries, etc.

For an example module, see the `example_module.tar.gz` file. If you extract it to the `modules` directory, you should see a new module, `Example Module`, showing up in the menu right away.

Preparing the Module
--------------------

Modules in the Yoda Portal follow the specification from the [HMVC package plugin](https://bitbucket.org/wiredesignz/codeigniter-modular-extensions-hmvc).
In addition, menu configuration settings have to be provided in a seperate **module.php** file inside the config directory of the module.

### The **module.php** file
**Location**: <module>/config/module.php

**Contents:**
```php
	$module['name'] 		= "module-name";
	$module['label'] 		= "Module Label";
	$module['glyph'] 		= "user";
	$module['menu_order'] 	= 10;
	$module['hide_menu']    = false;
```
**Content Clarification:**

The file defines a php array `module`, with four keys:

* **name** The name of the module, such as the directory it is places in should be called and such as the module appears in the url. This name should not contain spaces and should preferably be all lower case
* **label** The name of the module such as it should appear in the menu
* **glyph** The name of the [bootstrap glyph](http://getbootstrap.com/components/) that should be displayed next to the component link, without the leading "glyphicon glyyphicon-" part. For example, the glyph for user is `glyphicon glyphicon-user` so the value of the `glyph`-key should be *user*
* **menu_order** The lower this number, the more it appears to the left of the menu. All modules are sorted based on this number.
* **hide_menu** If `true`, the module will not appear in the YoDa Portal menu. This could be useful for creating modules that have a codebase that should be shared over other modules, with routing in place. Otherwise, the value should be set to `false`, to make it show up in the menu.

### Routing
Include your routing in the modules config/routing.php file (located in **config/routes.php**) rather than in the Yoda Portal or CodeIgniter application. The HMVC plugin makes the variable `$module` available in the routing file of a module. This variable contains the module name (which is the same as the directory name of the module).
Make sure that the uri defined in your **$module['name']** redirects to the main router of your module. For example:
```php
	$route['module-name'] = "module-name/module_controller";
```
The best practice way of doing this is by using the `$module` variable:
```php
    $route['default_controller']    = 'module_controller';
    $route[$module]                 = $module . "/module_controller";
```
Menu items for your module will refer to the module name, so it is important to resolve this uri in your routing table.

### Dynamic URI
If you refer to another controller or link to another file inside your module, it is adviced not to use the module name, but rather a variable which always contains the name of the module.

The HMVC variable `$module` is niet available in object context. The YoDa portal, however, provides a library that can be used. You can load this library from your module with:
```php
    $this->load->library('module', array(__DIR__));
```

This library provides three functions:
* `getModuleBase()` which returns the absolute URL to the module (this should automatically be resolved to the default controller, if the routing was set correctly)
* `name()` which returns the name of the module such as defined in the modules `config/module.php` or `config/module_local.php`
* `getModule()` which returns an object with the keys `path` (a relative path from the YoDa portal main URL to the module and it's default controller) and `basepath`, which provides the absolute URL to your module

These functions can then be called from object context with
```php
$this->module->name();
$this->module->getModuleBase();
$this->module->getModule();
```

### Helping your user
An example file of the config/module.php file is provided in this directory (with the same examples used as above, look for the **module.php** file). This file is especially
useful because of its content description and user guide, so copy the file to your own module.

Make sure to add the following line to your .gitignore:

	/config/module_local.php

This way, your settings can be overrided, without them changing every time the module is updated from Github.

Because your routes.php contains a reference to how you called this directory, you have to make sure the person who adds this module to the Yoda Portal knows to name the directory the same way. Therefor, provide an example call to add the module to the portal, which includes the git repositry and the intended name of the directory. Anybody should be able to just copy this line and have it work (see **adding the Module** for examples).

Adding the Module
-----------------
To add the module, open the shell in the Yoda Portal root. Find the git URL of the module and run the **tools/add-module.sh** script, with the git url as the first argument, and the name defined in $module["name"] as the second:
```bash
	$ tools/add-module.sh https://github.com/user/yoda-portal-module.git module-name
```
Removing the module can be done with the **rm_module.sh** script:
```bash
	$ tools/rm-module.sh module-name
```

AUTHORS
-------

- [Jan de Mooij](https://github.com/AJdeMooij)