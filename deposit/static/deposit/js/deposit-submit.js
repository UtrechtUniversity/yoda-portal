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

    $("#accept_terms").change(function() {
        if($(this).checked && getStatus()) {
            $("#submit").prop('disabled', false);
        }
    });
});

async function getStatus()
{
    try {
        let status = await Yoda.call('deposit_status', {})
        if (status.data) {
            $('#data_check').removeClass('fa-times text-danger').addClass('fa-check text-success');
        }
        if (status.metadata) {
            $('#metadata_check').removeClass('fa-times text-danger').addClass('fa-check text-success');
        }
        if (status.data && status.metadata) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return false;
    }
    return false;
}

async function submitToVault()
{
    try {
        await Yoda.call('deposit_status', {})
    } catch (e) {
        console.log(e);
    }
}
