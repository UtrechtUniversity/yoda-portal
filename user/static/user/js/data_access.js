"use strict";

$(document).ready(function() {
    $("body").on("click", ".delete-token", function(e) {
        let label = $(this).siblings('label').text();
        Yoda.call('token_delete', {"label": label}, {"quiet": true}).then(
            (data) => {
                $(this).parent().remove();
            },
            (error) => {
                 Yoda.set_message(
                    'error',
                    `An error occurred while creating the token, please try another label. If the issue persists, contact your administrator`);
            });
    });

    $("body").on("click", "#generateButton", function(e){
        let label = $("#f-token-label").val();

        let button = document.getElementById('generateButton');
        button.setAttribute("hidden", true);

        Yoda.call("token_generate", {"label": label}, {"quiet": true}).then(
            (data) => {
                $('#f-token').val(data);
                let p = document.getElementById('passwordOk');
                p.removeAttribute("hidden");
            },
            (error) => {
                let p = document.getElementById('passwordError');
                p.removeAttribute("hidden");
                button.removeAttribute("hidden");
            });
    });
});
