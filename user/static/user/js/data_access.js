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
                    `An error occurred while deleting the data access password. If the issue persists, contact your administrator.`);
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
                let error_id = "passwordGenerateError";
                if (error.status === "error_TokenExistsError") {
                    error_id = "passwordLabelError";
                }
                let p = document.getElementById(error_id);
                p.removeAttribute("hidden");
                button.removeAttribute("hidden");
            });
    });

    $('.btn-copy-to-clipboard').click(function(){
        textToClipboard($('#f-token').text());
    });

    var passwordModal = document.getElementById('dataAccessPassword');
    passwordModal.addEventListener('hidden.bs.modal', function (event) {
        $(this).find('form').trigger('reset');
        window.location.reload();
    });
});

function textToClipboard (text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}
