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
							+ '<p>' + YodaPortal.escapeEntities(item.message) + '</p>'
						+ '</div>'
					);
				});
			}
		},
	};

	YodaPortal.extend('api', {
		// Bare API call.  Use call() instead -- see further down below.
		call_: async function(path, data={}, options={}) {
			// POST an API request, return results as a Promise.
			//
			// The result of the promise, whether resolved or rejected, is
			// always an object containing status, status_info and data
			// properties.
			//
			// Failure of any kind (network, bad request, or any type of
			// non-'ok' status reported by the API rule itself) is returned as
			// a rejected Promise, while an 'ok' API status results in a
			// resolved Promise.

			let formData = new FormData();
			formData.append(YodaPortal.csrf.tokenName, YodaPortal.csrf.tokenValue);
			formData.append('data', JSON.stringify(data));

			let errorResult = (msg='Your request could not be completed due to an internal error') =>
				Promise.reject({'data': null, 'status': 'error_internal', 'status_info': msg});

			try {
				var r = await fetch('/api/'+path, {
					'method':      'POST',
					'body':        formData,
					'credentials': 'same-origin',
				});
			} catch (error) {
				// Network failure / abort.
				console.error(`API Error: ${error}`);
				return errorResult('Your request could not be completed due to a network connection issue.'
					              +' Please try again in a few minutes.');
			}
			if (!((r.status >= 200 && r.status < 300) || r.status == 500)) {
				// API responses should either produce 200 or 500.
				// Any other status code indicates an internal error without (human-readable) information.
				console.error(`API Error: HTTP status ${r.status}`);
				return errorResult();
			}
			try {
				var j = await r.json();
			} catch (error) {
				console.error(`API Error: Bad response JSON: ${error}`);
				return errorResult();
			}
			if (!('status' in j && 'status_info' in j && 'data' in j)) {
				console.error('API Error: missing status/status_info/data in response JSON', j);
				return errorResult();
			}
			if (j.status === 'ok')
				return Promise.resolve(j);
			return Promise.reject(j);
		},

		// Call an API function and log errors.
		// By default, failures (responses containing non-ok API result
		// 'status') are reported to the user as red boxes containing
		// 'status_info'. Setting options.quiet to true inhibits this behavior.
		//
		// On API success, a Promise is resolved with as a value, the result's 'data' property.
		// On failure, a Promise is rejected with the complete result (containing status and status_info).
		//
		// If options.rawResult is set to true, the promise is always resolved.
		// The resolved value will be an object containing {status, status_info, data}.
		// The caller is then responsible for handling any error that may occur.
		// (an error message may still be printed unless 'quiet' is also set to true)
		//
		call: function(path, data={}, options={}) {
			const quiet       = 'quiet'       in options ? options.quiet            : false;
			const errorPrefix = 'errorPrefix' in options ? options.errorPrefix+': ' : '';
			const rawResult   = 'rawResult'   in options ? options.rawResult        : false;

			console.log(`API: ${path}()`);

			return this.call_(path, data)
				.then((x)  => {
					if (YodaPortal.version === 'development')
						console.log(`API: ${path} result: `, x);
					return rawResult ? x : x.data;
				}).catch((x) => {
					console.error(`API: ${path} failed: `, x);
					if (!quiet) {
						if (YodaPortal.version === 'development' && 'debug_info' in x)
							setMessage('error', `${errorPrefix}${x.status_info} //// debug information: ${path}: ${x.debug_info}`);
						else
							setMessage('error', errorPrefix+x.status_info);
					}
					return rawResult ? Promise.resolve(x) : Promise.reject(x);
				});
		},
	});

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

	YodaPortal.extend('message', function(type, msg) {
		// Saves a message to be shown on the next page-load.
		YodaPortal.storage.session.set('messages',
			YodaPortal.storage.session.get('messages', []).concat({ type: type, message: msg }));
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
