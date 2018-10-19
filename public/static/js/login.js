$(document).ready(function() {
    // Warn user if capitals are used in username.
    $('#f-login-username').on('input',function(e){
        if($('#f-login-username').val().replace(/[^A-Z]/g, "").length > 0) {
            $('#capitals').removeClass("hidden");
        } else {
            $('#capitals').addClass("hidden");
        }
    });
});
