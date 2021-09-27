"use strict";

$(document).ready(function() {
    $("body").on("click", ".delete-token", function(e) {
        let label = $(this).siblings('label').text();
        Yoda.call('delete_token', {"label": label}, {"quiet": true}).then(
            (data) => {
                $(this).parent().remove();
            },
            (error) => {
                 Yoda.set_message(
                    'error',
                    `An error occurred while creating the token, please try another label. If the issue persists, contact your administrator`);
            });
    });

    $("body").on("click", "a.gen-token", function(e){
        let label = $("#f-token-label").val();
        Yoda.call("generate_token", {"label": label}, {"quiet": true}).then(
            (data) => {
                $('#f-token').val(data);
                $('a.gen-token').hide();
                // Please store the password somewhere safe, you will not be able to do so after you close this window!
            },
            (error) => {
                Yoda.set_message(
                    'error',
                    `An error occurred while creating the token,
please try another label.
If the issue persists, contact your administrator`);
            });
    });
});
