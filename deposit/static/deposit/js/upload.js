/* Flow upload functionality
Uses basic list of uploading files
Fancy UI with progress bars later from research module
*/

$(function() {
    console.log('ready');

    // Set path
    var path = $("#path").html();

//    JS api call (alternative)
//    Yoda.call('deposit_path').then((data) => {
//        console.info("Path: " + data.deposit_path);
//        path = String(data.deposit_path);
//    });

    var r = new Flow({
        target: '/research/upload',     // We use the code from research. Changed from research/flow_upload
        chunkSize: 10 * 1024 * 1024,
        simultaneousUploads: 5,
        query: {'csrf_token': Yoda.csrf.tokenValue, 'filepath': path}
    });
    // Flow.js isn't supported, fall back on a different method
    if (!r.support) {
        Yoda.set_message('error', 'No browser support.');
        return ;
    }

    // Show a place for dropping/selecting files
    $('.flow-drop').show();
    r.assignDrop($('.flow-drop')[0]);
    r.assignBrowse($('.flow-browse')[0]);
    r.assignBrowse($('.flow-browse-folder')[0], true);

    // Handle file add event
    r.on('fileAdded', function(file){
        console.log(file);
        // Show progress bar
        $('.flow-progress, .flow-list').show();
        // Add the file to the list
        $('.flow-list').append(
            '<li class="flow-file flow-file-'+file.uniqueIdentifier+'">' +
            'Uploading <span class="flow-file-name"></span> ' +
            '<span class="flow-file-size"></span> ' +
            '<span class="flow-file-progress"></span> ' +
            '<span class="flow-file-pause"><u>Pause upload</u></span>' +
            '<span class="flow-file-resume"><u>Resume upload</u></span>' +
            '<span class="flow-file-cancel"><u>Cancel upload</u></span>'
        );
        var $self = $('.flow-file-'+file.uniqueIdentifier);
        $self.find('.flow-file-name').text(file.relativePath);
        $self.find('.flow-file-size').text(readablizeBytes(file.size));
        $self.find('.flow-file-pause').on('click', function () {
            file.pause();
            $self.find('.flow-file-pause').hide();
            $self.find('.flow-file-resume').show();
        });
        $self.find('.flow-file-resume').on('click', function () {
            file.resume();
            $self.find('.flow-file-pause').show();
            $self.find('.flow-file-resume').hide();
        });
        $self.find('.flow-file-cancel').on('click', function () {
            file.cancel();
            $self.remove();
        });
    });
    r.on('filesSubmitted', function(file) {
        r.upload();
    });
    r.on('complete', function(){
        // Hide pause/resume when the upload has completed
        $('.flow-progress .progress-resume-link, .flow-progress .progress-pause-link').hide();
    });
    r.on('fileSuccess', function(file,message){
        var $self = $('.flow-file-'+file.uniqueIdentifier);
        // Reflect that the file upload has completed
        $self.find('.flow-file-progress').text('(completed)');
        $self.find('.flow-file-pause, .flow-file-resume').remove();
    });
    r.on('fileError', function(file, message){
        // Reflect that the file upload has resulted in error
        $('.flow-file-'+file.uniqueIdentifier+' .flow-file-progress').html('(file could not be uploaded)');
    });
    r.on('fileProgress', function(file){
        // Handle progress for both the file and the overall upload
        $('.flow-file-'+file.uniqueIdentifier+' .flow-file-progress')
            .html(Math.floor(file.progress()*100) + '% '
                + readablizeBytes(file.averageSpeed) + '/s '
                + secondsToStr(file.timeRemaining()) + ' remaining') ;
        $('.progress-bar').css({width:Math.floor(r.progress()*100) + '%'});
    });
    r.on('uploadStart', function(){
        // Show pause, hide resume
        $('.flow-progress .progress-resume-link').hide();
        $('.flow-progress .progress-pause-link').show();
    });
    r.on('catchAll', function() {
        console.log.apply(console, arguments);
    });
});

function readablizeBytes(bytes) {
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
}
function secondsToStr (temp) {
    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    return seconds + ' second' + numberEnding(seconds);
}
