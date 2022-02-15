"use strict";

let OpenSearchApi = {};
let currentSearchString;

$(function() {
    if ($("#search-filter").val().length > 0) {
        currentSearchString = $("#search-filter").val();
        OpenSearchApi.call(
            {
                name: 'Title',
                value: currentSearchString,
                from: 0,
                size: 3
            },
            {'quiet': true, 'rawResult': true}
        ).then((data) => {
            console.log(data);
        });
    }
});

OpenSearchApi.call = async function(data={}, options={}) {
    // Bare API call.
    let call_ = async (data={}, options={}) => {

        let formData = new FormData();
        // Note: csrf is set in start.php.
        formData.append(Yoda.csrf.tokenName, Yoda.csrf.tokenValue);
        formData.append('data', JSON.stringify(data));

        let errorResult = (msg='Your request could not be completed due to an internal error') =>
            Promise.reject({'data': null, 'status': 'error_internal'});

        try {
            var r = await fetch('/api_index/query', {
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
        if (!((r.status >= 200 && r.status < 300) || r.status == 400 || r.status == 500)) {
            // API responses should either produce 200, 400 or 500.
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

        if (j.status === 'ok') {
            return Promise.resolve(j);
        }
        return Promise.reject(j);
    };
    
    const quiet       = 'quiet'       in options ? options.quiet            : false;
    const errorPrefix = 'errorPrefix' in options ? options.errorPrefix+': ' : '';
    const rawResult   = 'rawResult'   in options ? options.rawResult        : false;

    try {
        let x = await call_(data);
        if (Yoda.version === 'development')
            console.log(`OpenSearch API: result:`, x);
        return rawResult ? x : x.data;
    } catch (x) {
        console.error(`OpenSearch API: failed: `, x);
        if (!quiet) {
            if (Yoda.version === 'development' && 'debug_info' in x)
                Yoda.set_message('error', `${errorPrefix}${x.status} //// debug information: ${x.debug_info}`);
            else
                Yoda.set_message('error', errorPrefix+x.status);
        }
        if (rawResult)
            return x;
        else throw  x;
    }
}