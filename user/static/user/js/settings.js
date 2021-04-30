"use strict";

$(function() {
    $("body").on("click", ".custom-switch", function(e) {
        let type = $("#mail_notifications_type")
        if($('#mail_notifications').prop('checked')) {
            type.prop('disabled', false);
        } else {
            type.prop('disabled', true);
        }
    });
});
