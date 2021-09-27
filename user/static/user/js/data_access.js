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

    $("body").on("click", "a.gen-token", function(){
        label = $("#f-token-label").val();
        $('#messages').empty();

        Yoda.call("generate_token", data={"label": label}, options={"quiet": true}).then(
            (data) => {
                $('#f-token').val(data);
                Yoda.set_message(
                    'success',
                    `Token created! Please store the token somewhere safe,
you will not be able to do so after you leave this page!`);
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
