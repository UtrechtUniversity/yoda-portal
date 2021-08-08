"use strict";

$(document).ready(function() {
    $("body").on("click", ".custom-switch", function(e) {
        let type = $("#mail_notifications_type")
        if($('#mail_notifications').prop('checked')) {
            type.prop('disabled', false);
        } else {
            type.prop('disabled', true);
        }
    });

    $("body").on("click", ".delete-token", function(e) {
        let label = $(this).siblings('label').text();
        console.log(label);

        Yoda.call('delete_token', {"label": label}, {"quiet": true}).then(
            (data) => {
                $(this).parent().remove();
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
