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
    $("body").on("click", "button#submit", function() {
        submitToVault();
    });
});

async function submitToVault()
{
    try {
        let status = await Yoda.call('deposit_status', {})
        console.log(status);
        let status = await Yoda.call('deposit_submit', {})
        console.log(status);
    } catch (e) {
        console.log(e);
    }
}
