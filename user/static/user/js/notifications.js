"use strict";

$(function() {
    $("body").on("click", "a.dismiss-notification", function() {
        let identifier = $(this).attr('data-id');
        $(this).closest('tr').remove();
        Yoda.call('notifications_dismiss', {identifier: identifier});
    });
});
