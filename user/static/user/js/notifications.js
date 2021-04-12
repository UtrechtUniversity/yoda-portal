"use strict";

$(function() {
    $("body").on("click", "h5.dismiss-notification", function() {
        let identifier = $(this).attr('data-id');
        $(this).closest('a.list-group-item').remove();
        Yoda.call('notifications_dismiss', {identifier: identifier});
    });
});
