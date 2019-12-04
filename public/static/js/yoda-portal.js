/**
 * \file
 * \brief     Yoda Portal platform code.
 * \author    Chris Smeele
 * \copyright Copyright (c) 2015 - 2019, Utrecht university. All rights reserved
 * \license   GPLv3, see LICENSE
 */

"use strict";

/// Namespace for JS functions shared across Yoda modules.
let Yoda = {};

Yoda.message = function(type, msg) {
    // Saves a message to be shown on the next page-load.
    Yoda.storage.session.set('messages',
                             Yoda.storage.session.get('messages', [])
                             .concat({ type: type, message: msg }));
};

Yoda.load = function() {
    // Insert sessionStorage messages if a #messages container is present.
    let $messages = $('#messages');
    if ($messages.length) {
        let messages = Yoda.storage.session.get('messages', []);
        Yoda.storage.session.remove('messages');

        messages.forEach(item =>
            $messages.append(`<div class="alert alert-${item.type}">`
                             + '<button class="close" data-dismiss="alert"><span>&times;</span></button>'
                             + `<p>${Yoda.escapeEntities(item.message)}</p>`
                             + '</div>'));
    }
};

// Yoda.api = {
Yoda.call = async function(path, data={}, options={}) {
    // Bare API call.
    let call_ = async (path, data={}, options={}) => {
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
        // Note: csrf is set in start.php.
        formData.append(Yoda.csrf.tokenName, Yoda.csrf.tokenValue);
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
    };

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
    const quiet       = 'quiet'       in options ? options.quiet            : false;
    const errorPrefix = 'errorPrefix' in options ? options.errorPrefix+': ' : '';
    const rawResult   = 'rawResult'   in options ? options.rawResult        : false;

    if (Yoda.version === 'development')
        console.log(`API: ${path}()`, data);
    else
        console.log(`API: ${path}()`);

    try {
        let x = await call_(path, data);
        if (Yoda.version === 'development')
            console.log(`API: ${path} result: `, x);
        return rawResult ? x : x.data;
    } catch (x) {
        console.error(`API: ${path} failed: `, x);
        if (!quiet) {
            if (Yoda.version === 'development' && 'debug_info' in x)
                setMessage('error', `${errorPrefix}${x.status_info} //// debug information: ${path}: ${x.debug_info}`);
            else
                setMessage('error', errorPrefix+x.status_info);
        }
        if (rawResult)
             return x;
        else throw  x;
    }
};

Yoda.storage = {
    _get: function(storage, key, defaultValue = null) {
        let item = storage.getItem('yoda.' + key);
        try {
            var json = item === null
                ? undefined
                : JSON.parse(item);
        } catch(ex) {
            var json = undefined;
        }
        return typeof(json) === 'undefined' ? defaultValue : json;
    },
    _set: function(storage, key, value) {
        storage.setItem('yoda.' + key, JSON.stringify(value));
    },
    _remove: function(storage, key) {
        storage.removeItem('yoda.' + key);
    },
    session: {
        get:    function(key, defaultValue) { return Yoda.storage._get   (sessionStorage, key, defaultValue); },
        set:    function(key, value)        {        Yoda.storage._set   (sessionStorage, key, value);        },
        remove: function(key)               {        Yoda.storage._remove(sessionStorage, key);               },
    },
    local: {
        get:    function(key, defaultValue) { return Yoda.storage._get   (localStorage, key, defaultValue); },
        set:    function(key, value)        {        Yoda.storage._set   (localStorage, key, value);        },
        remove: function(key)               {        Yoda.storage._remove(localStorage, key);               },
    }
};

/// Escapes quotes in attribute selectors.
Yoda.escapeQuotes = str => str.replace(/\\/g, '\\\\').replace(/("|')/g, '\\$1');

 /// Escape characters that may have a special meaning in HTML by converting them to HTML entities.
Yoda.escapeEntities = str => $('<div>').text(str).html();

$(Yoda.load);
