"use strict";

$(document).ajaxSend(function(e, request, settings) {
    // Append a CSRF token to all AJAX POST requests.
    if (settings.type === 'POST' && settings.data.length) {
         settings.data
             += '&' + encodeURIComponent(Yoda.csrf.tokenName)
              + '=' + encodeURIComponent(Yoda.csrf.tokenValue);
    }
});

$(function() {
    getStatus();

    $("body").on("click", "button#submit", function() {
        submitToVault();
    });
});

async function getStatus()
{
    try {
        let status = await Yoda.call('deposit_status', {})
    } catch (e) {
        console.log(e);
    }
}

async function submitToVault()
{
    try {
        await Yoda.call('deposit_status', {})
    } catch (e) {
        console.log(e);
    }
}
