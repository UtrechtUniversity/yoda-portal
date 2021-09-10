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
});
