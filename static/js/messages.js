toastr.options = {
    toastClass: 'alert',
    closeButton: true,
    target: '#messages',
    containerId: 'messages-container',
    closeHtml: '<a href="#" data-dismiss="alert" aria-label="close" title="close">×</a>',
    closeClass: 'close',
    timeOut: 0,
    extendedTimeOut: 0,
    tapToDismiss: false,
    showMethod: 'show',
    fadeOut: 0,
    fadeIn: 0,
    showDuration: 0,
    hideDuration: 0,
    iconClasses: {
        error: 'alert-danger',
        info: 'alert-info',
        success: 'alert-success',
        warning: 'alert-warning'
    }
};

function setMessage(type, text)
{
    // Remove all messages
    toastr.remove();

    if (type == 'success') {
        toastr.success(text);
    } else if (type == 'error') {
        toastr.error(text);
    } else if (type == 'warning') {
        toastr.warning(text);
    } else if (type == 'info') {
        toastr.info(text);
    }
}