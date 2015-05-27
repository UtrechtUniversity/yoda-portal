/**
 * \file
 * \brief     Yoda Portal platform code.
 * \author    Chris Smeele
 * \copyright Copyright (c) 2015, Utrecht university. All rights reserved
 * \license   GPLv3, see LICENSE
 */

"use strict";

$(function(){
	window.YodaPortal = window.YodaPortal || {
		parent: null,

		/**
		 * \brief Add a component to YodaPortal.
		 *
		 * \param path      the path within the YodaPortal namespace to attach the other parameter to
		 * \param namespace an object or any other type to install in the YodaPortal namespace under the given name
		 */
		extend: function(path, namespace) {
			/**
			 * \brief Add a 'parent' property to a component and its children.
			 *
			 * Skips object property names starting with '$' or '_'.
			 *
			 * \param root     the parent of the new component
			 * \param property the component property name
			 */
			function setParent(root, property) {
				if (
					   !root[property].hasOwnProperty('parent')
					&& !(
						   property.indexOf('$') === 0
						|| property.indexOf('_') === 0
					)
				) {
					Object.defineProperty(root[property], 'parent', { value: root });
					for (var child in root[property])
						if (typeof(root[property][child]) === 'object' && root[property][child] !== null)
							setParent(root[property], child);
				}
			}
			(function extendPart(root, name, namespace) {
				var parts = name.split('.');
				if (parts.length > 1) {
					var dir = parts.shift();

					if (root.hasOwnProperty(dir) && typeof(root[dir]) !== 'object' || Array.isArray(root[dir]))
						delete root[dir];

					if (!root.hasOwnProperty(dir)) {
						root[dir] = { };
						Object.defineProperty(root[dir], 'parent', { value: root });
					}

					extendPart(root[dir], parts.join('.'), namespace);
				} else {
					// Replace members of different types.
					if (
						root.hasOwnProperty(name)
						&& (
							typeof(root[name]) !== typeof(namespace)
							|| Array.isArray(root[name]) !== Array.isArray(namespace)
						)
					)
						delete root[name];

					if (root.hasOwnProperty(name) && typeof(namespace) === 'object') {
						if (Array.isArray(namespace)) {
							root[name] = root[name].concat(namespace);
						} else {
							for (var property in namespace) {
								if (root[name].hasOwnProperty(property)) {
									extendPart(root[name], property, namespace[property]);
								} else {
									root[name][property] = namespace[property];
									if (typeof(namespace[property]) === 'object' && namespace[property] !== null)
										setParent(root[name], property);
								}
							}
						}
					} else {
						root[name] = namespace;
						if (typeof(namespace) === 'object' && namespace !== null)
							setParent(root, name);
					}
				}
			})(this, path, namespace);

			return this;
		},
		load: function() {
			// Insert sessionStorage messages if a #messages container is present.
			var $messages = $('#messages');
			if ($messages.length) {
				var messages = this.storage.session.get('messages', []);
				this.storage.session.remove('messages');

				messages.forEach(function(item) {
					$messages.append(
						  '<div class="alert alert-' + item.type + '">'
							+ '<button class="close" data-dismiss="alert"><span>&times;</span></button>'
							+ '<p>' + item.message + '</p>'
						+ '</div>'
					);
				});
			}
		},
	};

	/**
	 * \brief Yoda storage component.
	 */
	YodaPortal.extend('storage', {
		prefix: 'yoda-portal.group-manager',
		any: {
			get: function(storage, key, defaultValue) {
				var item = storage.getItem(this.parent.prefix + '.' + key);
				try {
					var json = item === null
					           ? undefined
							   : JSON.parse(item);
				} catch(ex) {
					var json = undefined;
				}
				return typeof(json) === 'undefined'
					? typeof(defaultValue) === 'undefined'
						? null : defaultValue
					: json;
			},
			set: function(storage, key, value) {
				storage.setItem(this.parent.prefix + '.' + key, JSON.stringify(value));
			},
			remove: function(storage, key) {
				storage.removeItem(this.parent.prefix + '.' + key);
			},
		},
		session: {
			get:    function(key, defaultValue) { return this.parent.any.get   (sessionStorage, key, defaultValue); },
			set:    function(key, value)        {        this.parent.any.set   (sessionStorage, key, value);        },
			remove: function(key)               {        this.parent.any.remove(sessionStorage, key);               },
		},
		local: {
			get:    function(key, defaultValue) { return this.parent.any.get   (localStorage, key, defaultValue); },
			set:    function(key, value)        {        this.parent.any.set   (localStorage, key, value);        },
			remove: function(key)               {        this.parent.any.remove(localStorage, key);               },
		}
	});

	/**
	 * \brief A utility function for escaping quotes in attribute selectors.
	 *
	 * \param str
	 *
	 * \return
	 */
	YodaPortal.extend('escapeQuotes', function(str) {
		return str.replace(/\\/g, '\\\\').replace(/("|')/g, '\\$1');
	});

	/**
	 * \brief Escape characters that may have a special meaning in HTML by converting them to HTML entities.
	 *
	 * \param str
	 *
	 * \return
	 */
	YodaPortal.extend('escapeEntities', function(str) {
		return $('<div>').text(str).html();
	});

	YodaPortal.load();
});
