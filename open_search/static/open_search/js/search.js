"use strict";

let OpenSearchApi = {};
let currentSearchString;
let currentFrom = 0;
let currentSize = 3;

$(function() {
    if ($("#search-filter").val().length > 0) {
        let filter = $("#search-filter").val();
        search(filter, currentFrom, currentSize);
    }

    $("#search-filter").on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            let filter = $("#search-filter").val();
            search(filter, currentFrom, currentSize);
        }
    });

    $(".search-btn").click(function() {
        let filter = $("#search-filter").val();
        search(filter, currentFrom, currentSize);
    });
});


function search(term, from, size)
{
    load(true);
    //changeUrlParam(term);
    currentSearchString = term;

    OpenSearchApi.call(
        {
            name: 'Title',
            value: term,
            from: from,
            size: size
        },
        {'quiet': true, 'rawResult': true}
    ).then((data) => {
        let html = '';
        if (data.matches.length) {
            html += '<p class="fs-6 fst-italic mb-2">' + data.matches.length + ' result(s)</p>'
            $(data.matches).each(function(index, element ) {
                let attr = {};
                $(element.attributes).each(function(index, attribute) {
                    attr[attribute.name] = attribute.value;
                });
                html += itemTemplate(attr);
            });
        } else {
            html = "<p>Your search '" + Yoda.escapeEntities(term) + "' did not match any data package.</p>";
        }

        $('#search-results').html(html);
        load(false);
    });
}

function load(loading = true)
{
    if (loading) {
        $('.search-btn').html('<i class="fa-solid fa-spinner fa-spin-pulse"></i>');
    } else {
        $('.search-btn').html('<i class="fa fa-search"></i>');
    }
}

function itemTemplate(data)
{
    let access;
    if(data.Data_Access_Restriction.substring(0, 4) == 'Open') {
        access = `
        <span class="badge rounded-pill bg-success">
            <i class="fa-solid fa-lock-open"></i> Open
        </span>`;
    } else {
        access = `
        <span class="badge rounded-pill bg-warning">
            <i class="fa-solid fa-lock"></i> Restricted
        </span>`;
    }
    let description = truncate(data.Description, 265, '...');

    let date = '';
    if ('Creation_Time' in data) {
        date = formatDate(data.Creation_Time * 1000);
    }

    let html = `
    <div class="card mb-3">
        <div class="card-body">
            <div class="card-title">
                <span class="title-text"><a href="/vault/yoda/${data.Data_Package_Reference}">${data.Title}</a></span>
                ${access}
            </div>
            <h6 class="card-subtitle mb-2 text-muted">
                <span>${data.Creator} (${data.Owner_Role})</span>
                <span class="float-end">${date}</span>
            </h6>
            <p class="card-text">
                ${description}
            </p>
        </div>
    </div>
    `;
    return html;
}
function truncate(str, max, suffix) {
    if (str.length < max) {
        return str;
    } else {
        return str.substring(0, max) + suffix;
    }
}

function formatDate(timestamp) {
    let d = new Date(timestamp);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

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
            var r = await fetch('/open_search/query', {
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
