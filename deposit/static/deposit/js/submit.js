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
        submitStatus();
    });

    // Load the terms and conditions:
    Yoda.call('vault_get_publication_terms', {}).then((data) => {
        $('#terms_conditions_modal .modal-body').html(data);
    });

});

async function submitStatus()
{
    let status = await getStatus();
    if($("#accept_terms").is(':checked') && status) {
        $("#submit").prop('disabled', false);
    } else {
        $("#submit").prop('disabled', true);
    }
}

async function getStatus()
{
    try {
        let status = await Yoda.call('deposit_status', {})
        if (status.data) {
            $('#data_check').removeClass('fa-times text-danger').addClass('fa-check text-success');
        } else {
            $('#data_check').removeClass('fa-check text-success').addClass('fa-times text-danger');
        }
        if (status.metadata) {
            $('#metadata_check').removeClass('fa-times text-danger').addClass('fa-check text-success');
        } else {
            $('#metadata_check').removeClass('fa-check text-success').addClass('fa-times text-danger');
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
        let result = await Yoda.call('deposit_submit', {},
            {'rawResult': true}
        );
        if (result.status == "ok") {
            window.location.href = '/deposit/thank-you';
        }
    } catch (e) {
        console.log(e);
    }
}
