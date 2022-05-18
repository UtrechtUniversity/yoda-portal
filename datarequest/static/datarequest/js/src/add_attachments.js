import "core-js/stable";
import "regenerator-runtime/runtime";

document.addEventListener("DOMContentLoaded", async () => {
    // Upload attachment
    $("body").on("click", "button.upload_attachment", data => {
        // Prepare form data
        var fd = new FormData(document.getElementById('attachment'));
        fd.append(Yoda.csrf.tokenName, Yoda.csrf.tokenValue);
    
        // Prepare XHR
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/datarequest/upload_attachment/" + config.request_id, false);
    
        // Send DTA
        xhr.send(fd);
    
        // Reload page after upload
        location.reload();
    });
});
