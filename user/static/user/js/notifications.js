"use strict";

$(function() {
    $("body").on("click", "a.list-group-item > h5.dismiss-notification", function(e) {
        e.preventDefault();
        let identifier = $(this).attr('data-id');
        $(this).closest('a.list-group-item').remove();
        Yoda.call('notifications_dismiss', {identifier: identifier});
    });
});
