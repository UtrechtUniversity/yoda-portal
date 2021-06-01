"use strict";

$(document).ajaxSend(function(e, request, settings) {
    // Append a CSRF token to all AJAX POST requests.
    if (settings.type === 'POST' && settings.data.length) {
         settings.data
             += '&' + encodeURIComponent(Yoda.csrf.tokenName)
              + '=' + encodeURIComponent(Yoda.csrf.tokenValue);
    }
});


/* TODO

Copied from research js
* Permission check
* flow uploads
*/


$(function() {

    $('.btn-group button.upload').click(function(){
        $("#upload").trigger("click");
    });

    $("#upload").change(function() {
        handleUpload($(this).attr('data-path'), this.files);
    });


});


function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html().replace('"', '&quot;');
}



function startBrowsing(items)
{
    $('#file-browser').DataTable({
        "bFilter": false,
        "bInfo": false,
        "bLengthChange": true,
        "language": {
            "emptyTable": "No accessible files/folders present",
            "lengthMenu": "_MENU_"
        },
        "dom": '<"top">frt<"bottom"lp><"clear">',
        'columns': [{render: tableRenderer.name,    data: 'name'},
                    // Size and date should be orderable, but limitations
                    // on how queries work prevent us from doing this
                    // correctly without significant overhead.
                    // (enabling this as is may result in duplicated results for data objects)
                    {render: tableRenderer.size,    orderable: false, data: 'size'},
                    {render: tableRenderer.date,    orderable: false, data: 'modify_time'},
                    {render: tableRenderer.context, orderable: false }],
        "ajax": getFolderContents,
        "processing": true,
        "serverSide": true,
        "iDeferLoading": 0,
        "pageLength": items
    });
    browse(currentFolder);
}

function toggleLocksList(folder)
{
    var isVisible = $('.lock').is(":visible");

    // toggle locks list
    if (isVisible) {
        $('.lock').hide();
    } else {
        // Get locks
        Yoda.call('folder_get_locks', {'coll':  Yoda.basePath + folder}).then((data) => {
            $('.lock').hide();

            var html = '';
            $.each(data, function (index, value) {
                html += '<a class="list-group-item list-group-item-action"><span class="browse" data-path="' + htmlEncode(value) + '">' + htmlEncode(value) + '</span></a>';
            });
            $('.lock-items').html(html);
            $('.lock').show();
        });
    }
}



function toggleSystemMetadata(folder)
{
    let systemMetadata = $('.system-metadata');
    let systemMetadataItems = $('.system-metadata-items');

    let isVisible = systemMetadata.is(":visible");

    // Toggle system metadata.
    if (isVisible) {
        systemMetadata.hide();
    } else {
        // Retrieve system metadata of folder.
        Yoda.call('research_system_metadata', {coll: Yoda.basePath + folder}).then((data) => {
            systemMetadata.hide();
            var html = '';
            if (data) {
                $.each(data, function(index, value) {
                    html += '<a class="list-group-item list-group-item-action"><strong>' +
                        htmlEncode(index) +
                        '</strong>: ' +
                        htmlEncode(value) +
                        '</a>';
                });
            } else {
                html += '<a class="list-group-item list-group-item-action">No system metadata present</a>';
            }
            systemMetadataItems.html(html);
            systemMetadata.show();
        });
    }
}


$(function maybeUseAllThis() {

            if (userType == 'reader') {
                var actions = [];
                hasWriteRights = false;
            }

            if (isDatamanager) {
                // Check rights as datamanager.
                if (userType != 'manager' && userType != 'normal') {
                    var actions = [];
                    hasWriteRights = false;
                }

                if (typeof status != 'undefined') {
                    if (status == 'SUBMITTED') {
                        actions['accept'] = 'Accept';
                        actions['reject'] = 'Reject';
                    }
                }
            }

            // Check if folder is writable.
            if (hasWriteRights && (status == '' || status == 'SECURED')) {
                // Enable uploads.
                $('#upload').attr('data-path', dir);
                $('.btn-group button.upload').prop("disabled", false);

                // Enable folder / file manipulations.
                $('.btn-group button.folder-create').attr('data-path', dir);
                $('.btn-group button.folder-create').prop("disabled", false);

                $('a.folder-delete').prop("disabled", false);
                $('a.folder-rename').prop("disabled", false);
                $('a.file-delete').prop("disabled", false);
                $('a.file-rename').prop("disabled", false);
            }

            // Lock icon
            $('.lock').hide();
            var lockIcon = '';
            if (lockCount != '0' && typeof lockCount != 'undefined') {
                lockIcon = `<i class="fa fa-exclamation-circle lock-icon" data-folder="${htmlEncode(dir)}" data-locks="${lockCount}" title="${lockCount} lock(s) found" aria-hidden="true"></i>`;
            }

            // Provenance action log
            $('.actionlog').hide();
            let actionLogIcon = ` <i class="fa fa-book actionlog-icon" style="cursor:pointer" data-folder="${htmlEncode(dir)}" aria-hidden="true" title="Show provenance information"></i>`;

            // System metadata.
            $('.system-metadata').hide();
            let systemMetadataIcon = ` <i class="fa fa-info-circle system-metadata-icon" style="cursor:pointer" data-folder="${htmlEncode(dir)}" aria-hidden="true" title="Show system metadata"></i>`;

            $('.btn-group button.folder-status').attr('data-write', hasWriteRights);

            // Add unpreservable files check to actions.
            actions['check-for-unpreservable-files'] = 'Check for compliance with policy';

            // Add go to vault to actions.
            if (typeof vaultPath != 'undefined' ) {
                actions['go-to-vault'] = 'Go to vault';
            }

            // Handle actions
            handleActionsList(actions, dir);

            // Set vault paths.
            if (typeof vaultPath != 'undefined' ) {
                $('a.action-go-to-vault').attr('vault-path', vaultPath);
            }

            let folderName = htmlEncode(basename).replace(/ /g, "&nbsp;");
            let statusBadge = '<span id="statusBadge" class="ml-2 badge badge-pill badge-primary">' + statusText + '</span>';

            // Reset action dropdown.
            $('.btn-group button.folder-status').prop("disabled", false).next().prop("disabled", false);

            var icon = '<i class="fa fa-folder-open-o" aria-hidden="true"></i>';
            $('.top-information h2').html(`<span class="icon">${icon}</span> ${folderName}${lockIcon}${systemMetadataIcon}${actionLogIcon}${statusBadge}`);

            // Show top information and buttons.
            if (typeof status != 'undefined') {
                $('.top-information').show();
                $('.top-info-buttons').show();
            }
        });
    } else {
        $('#upload').attr('data-path', "");

        // Folder/ file manipulation data
        $('.btn-group button.folder-create').attr('data-path', "");

        $('.top-information').hide();
    }
}

function handleActionsList(actions, folder)
{
    var html = '';
    var vaultHtml = '';
    var possibleActions = ['lock', 'unlock',
                           'submit', 'unsubmit',
                           'accept', 'reject'];

    var possibleVaultActions = ['check-for-unpreservable-files',
                                'go-to-vault'];

    $.each(possibleActions, function( index, value ) {
        if (actions.hasOwnProperty(value)) {
            html += '<a class="dropdown-item action-' + value + '" data-folder="' + htmlEncode(folder) + '">' + actions[value] + '</a>';
        }
    });

    $.each(possibleVaultActions, function( index, value ) {
        if (actions.hasOwnProperty(value)) {
            vaultHtml += '<a class="dropdown-item action-' + value + '" data-folder="' + htmlEncode(folder) + '">' + actions[value] + '</a>';
        }
    });

    if (html != '' && vaultHtml != '') {
        html += '<div class="dropdown-divider"></div>' + vaultHtml;
    } else if (vaultHtml != '') {
        html += vaultHtml;
    }

    $('.action-list').html(html);
}




function showMetadataForm(path)
{
    window.location.href = 'metadata/form?path=' + encodeURIComponent(path);
}

async function submitToVault(folder)
{
    if (typeof folder != 'undefined') {
        // Set spinner & disable button
        let btnText = $('#statusBadge').html();
        $('#statusBadge').html('Submit <i class="fa fa-spinner fa-spin fa-fw"></i>');
        $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

        try {
            let status = await Yoda.call('folder_submit', {'coll': Yoda.basePath + folder})
            if (status === 'SUBMITTED') {
                $('#statusBadge').html('Submitted');
            } else if (status === 'ACCEPTED') {
                $('#statusBadge').html('Accepted');
            } else {
                $('#statusBadge').html(btnText);
            }
        } catch (e) {
            $('#statusBadge').html(btnText);
        }
        topInformation(folder, false);
    }
}

async function unsubmitToVault(folder) {
    if (typeof folder != 'undefined') {
        var btnText = $('#statusBadge').html();
        $('#statusBadge').html('Unsubmit <i class="fa fa-spinner fa-spin fa-fw"></i>');
        $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

        try {
            let status = await Yoda.call('folder_unsubmit', {'coll': Yoda.basePath + folder})
            $('#statusBadge').html('');
        } catch(e) {
            $('#statusBadge').html(btnText);
        }
        topInformation(folder, false);
    }
}


// File uploads.
function handleUpload(path, files) {
    // Check if path is specified and files are uploaded.
    if (path == "" || files.length < 1)
        return;

    // Keep track of the number of uploads to generate unique element IDs.
    handleUpload.nextFileId = handleUpload.nextFileId || 1;

    let promises = [];
    $('#files').html("");
    $('#uploads').modal('show');

    // Send files one by one.
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Log file upload.
        const id = "upload" + handleUpload.nextFileId++;
        logUpload(id, file);

        // Check file size.
        if(file.size > 300*1024*1024) {
            $("#" + id + " .msg").html("Exceeds file limit");
            continue;
        }

        // Send file.
        promises.push(sendFile(id, path, file));
    }

    // Reload file browser if all promises are resolved.
    Promise.all(promises).then(function() {
        browse(path);
    });
}

function sendFile(id, path, file) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {

        const uri = "browse/upload";
        const xhr = new XMLHttpRequest();
        const fd = new FormData();

        xhr.open("POST", uri, true);

        xhr.onloadend = function (e) {
            if (xhr.readyState == 4 && xhr.status == 200) {
                let response = JSON.parse(xhr.response);
                if (response.status == "OK") {
                    $("#" + id + " .msg").html("OK");
                    resolve(xhr.response);
                } else {
                    $("#" + id + " .msg").html(response.statusInfo);
                    $("#" + id + " .progress-bar").css('width', '0%');
                    resolve(xhr.response);
                }
            } else {
                $("#" + id + " .msg").html("FAILED");
                $("#" + id + " .progress-bar").css('width', '0%');
                resolve(xhr.response);
            }
        }

        xhr.upload.addEventListener('progress', function(e) {
            var percent = parseInt((e.loaded / e.total) * 100);
            $("#" + id + " .progress-bar").css('width', percent + '%');
        });

        fd.append(Yoda.csrf.tokenName, Yoda.csrf.tokenValue);
        fd.append('filepath', path);
        fd.append('file', file);

        // Initiate a multipart/form-data upload.
        xhr.send(fd);
    });
}



function logUpload(id, file) {
    let log = `<div class="row" id="${id}">
                  <div class="col-md-6" style="word-wrap: break-word;">${htmlEncode(file.name)}</div>
                  <div class="col-md-3"><div class="progress"><div class="progress-bar progress-bar-striped bg-info"></div></div></div>
                  <div class="col-md-3 msg"><i class="fa fa-spinner fa-spin fa-fw"></i></div>
               </div>`;
    $('#files').append(log);
}

function dropHandler(ev) {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    handleUpload($("#upload").attr('data-path'), ev.dataTransfer.files);
}

function dragOverHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}
