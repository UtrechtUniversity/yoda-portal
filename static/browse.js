"use strict";

$(document).ajaxSend(function(e, request, settings) {
    // Append a CSRF token to all AJAX POST requests.
    if (settings.type === 'POST' && settings.data.length) {
         settings.data
             += '&' + encodeURIComponent(Yoda.csrf.tokenName)
              + '=' + encodeURIComponent(Yoda.csrf.tokenValue);
    }
});

let preservableFormatsLists = null;
let currentFolder;

$(function() {
    // Extract current location from query string (default to '').
    currentFolder = decodeURIComponent((/(?:\?|&)dir=([^&]*)/
                                        .exec(window.location.search) || [0,''])[1]);

    // Canonicalize path somewhat, for convenience.
    currentFolder = currentFolder.replace(/\/+/g, '/').replace(/\/$/, '');


    if ($('#file-browser').length) {
        startBrowsing(browsePageItems);
    }

    $('.btn-group button.metadata-form').click(function(){
        showMetadataForm($(this).attr('data-path'));
    });

    $('.btn-group button.upload').click(function(){
        $("#upload").trigger("click");
    });

    $("#upload").change(function() {
        handleUpload($(this).attr('data-path'), this.files);
    });

    $("body").on("click", "a.view-video", function() {
        let path = $(this).attr('data-path');
        let viewerHtml = `<video width="570" controls autoplay><source src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}"></video>`;
        $('#viewer').html(viewerHtml);
        $('#viewMedia').modal('show');
    });

    $("body").on("click", "a.view-audio", function() {
        let path = $(this).attr('data-path');
        let viewerHtml = `<audio width="570" controls autoplay><source src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}"></audio>`;
        $('#viewer').html(viewerHtml);
        $('#viewMedia').modal('show');
    });

    $("body").on("click", "a.view-image", function() {
        let path = $(this).attr('data-path');
        let viewerHtml = `<img width="570" src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}" />`;
        $('#viewer').html(viewerHtml);
        $('#viewMedia').modal('show');
    });

    $("#viewMedia.modal").on("hidden.bs.modal", function() {
        $("#viewer").html("");
    });

    $("body").on("click", "a.action-lock", function() {
        lockFolder($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-unlock", function() {
        unlockFolder($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-submit", function() {
        submitToVault($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-check-for-unpreservable-files", function() {
        // Check for unpreservable file formats.
        // If present, show extensions to user.
        let folder = $(this).attr('data-folder');
        $("#file-formats-list").val('');

        $('#showUnpreservableFiles .help').hide();
        $('#showUnpreservableFiles .preservable').hide();
        $('#showUnpreservableFiles .advice').hide();
        $('#showUnpreservableFiles .unpreservable').hide();
        $('#showUnpreservableFiles .checking').hide();

        if (preservableFormatsLists === null) {
            // Retrieve preservable file format lists.
            Yoda.call('vault_preservable_formats_lists').then((data) => {
                preservableFormatsLists = data;

                $('#file-formats-list').html("<option value='' disabled selected>Select a file format list</option>");
                for (let list in data) {
                    if (data.hasOwnProperty(list)) {
                        $("#file-formats-list").append(new Option(data[list]['name'], list));
                    }
                }
                $('#showUnpreservableFiles').modal('show');
            });
        } else {
            $('#showUnpreservableFiles').modal('show');
        }
    });

    $("#file-formats-list").change(function() {
        let folder = $('a.action-check-for-unpreservable-files').attr('data-folder');
        let list   = $('#file-formats-list option:selected').val();
        if (!(list in preservableFormatsLists))
            return;

        $('#showUnpreservableFiles .checking').show();
        $('#showUnpreservableFiles .unpreservable').hide();
        $('#showUnpreservableFiles .preservable').hide();
        $('#showUnpreservableFiles .advice').hide();
        $('#showUnpreservableFiles .help'  ).hide();

        $('#showUnpreservableFiles .help'  ).text(preservableFormatsLists[list]["help"]);
        $('#showUnpreservableFiles .advice').text(preservableFormatsLists[list]["advice"]);

        // Retrieve unpreservable files in folder.
        Yoda.call('vault_unpreservable_files',
                  {coll: Yoda.basePath + folder, list_name: list}).then((data) => {
            $('#showUnpreservableFiles .checking').hide();
            $('#showUnpreservableFiles .help').show();
            if (data.length > 0) {
                $('#showUnpreservableFiles .list-unpreservable-formats').html('');
                for (let ext of data)
                    $('#showUnpreservableFiles .list-unpreservable-formats').append(`<li>${htmlEncode(ext)}</li>`);
                $('#showUnpreservableFiles .advice').show();
                $('#showUnpreservableFiles .unpreservable').show();
            } else {
                $('#showUnpreservableFiles .preservable').show();
            }
            $('#showUnpreservableFiles').modal('show');
        });
    });

    $("body").on("click", "a.action-unsubmit", function() {
        unsubmitToVault($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-accept", function() {
        acceptFolder($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-reject", function() {
        rejectFolder($(this).attr('data-folder'));
    });

    $("body").on("click", "i.lock-icon", function() {
        toggleLocksList($(this).attr('data-folder'));
    });

    $("body").on("click", "i.actionlog-icon", function() {
        toggleActionLogList($(this).attr('data-folder'));
    });

    $("body").on("click", "i.system-metadata-icon", function() {
        toggleSystemMetadata($(this).attr('data-folder'));
    });

    $("body").on("click", ".browse", function(e) {
        browse($(this).attr('data-path'), true);
        // Dismiss stale messages.
        $('#messages .close').click();
        e.preventDefault();
    });

    $("body").on("click", "a.action-go-to-vault", function() {
        window.location.href = '/vault/?dir=' + encodeURIComponent('/'+$(this).attr('vault-path'));
    });
});

function changeBrowserUrl(path)
{
    let url = window.location.pathname;
    if (typeof path != 'undefined') {
        url += "?dir=" + encodeURIComponent(path);
    }

    history.pushState({} , {}, url);
}

function browse(dir = '', changeHistory = false)
{
    currentFolder = dir;
    makeBreadcrumb(dir);
    if (changeHistory)
        changeBrowserUrl(dir);
    topInformation(dir, true); //only here topInformation should show its alertMessage
    buildFileBrowser(dir);
}

function makeBreadcrumb(dir)
{
    let pathParts = dir.split('/').filter(x => x.length);

    // [[Crumb text, Path]] - e.g. [...['x', '/research-a/x']]
    let crumbs = [['Home', ''],
                  ...Array.from(pathParts.entries())
                          .map(([i,x]) => [x, '/'+pathParts.slice(0, i+1).join('/')])];

    let html = '';
    for (let [i, [text, path]] of crumbs.entries()) {
        let el = $('<li>');
        text = htmlEncode(text).replace(/ /g, '&nbsp;');
        if (i === crumbs.length-1)
             el.addClass('active').text(text);
        else el.html(`<a class="browse" data-path="${htmlEncode(path)}"
                         href="?dir=${encodeURIComponent(path)}">${text}</a>`);

        html += el[0].outerHTML;
    }

    $('ol.breadcrumb').html(html);
}

function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html().replace('"', '&quot;');
}

function buildFileBrowser(dir) {
    let fileBrowser = $('#file-browser').DataTable();
    getFolderContents.dropCache();
    fileBrowser.ajax.reload();

    return true;
}

// Fetches directory contents to populate the listing table.
let getFolderContents = (() => {
    // Close over some state variables.
    // -> we keep a multi-page cache handy, since getting only $page_length [=10]
    //    results each time is wasteful and slow.
    // A change in sort column/order or folder will invalidate the cache.

    // The amount of rows to request at once.
    // *Must* be equal to or greater than the largest datatables page length,
    // and *should* be smaller than iRODS SQL rows per batch.
    const batchSize = 200;
    // (~140 B per entry in JSON returned by iRODS,
    //  so depending on name = up to 28K to transfer for each fetch)

    let total          = false; // Total subcollections / data objects.
    let cache          = [];    // Cached result rows (may be more than shown on one page).
    let cacheStart     = null;  // Row number of the first cache entry.
    let cacheFolder    = null;  // Folder path of the cache.
    let cacheSortCol   = null;  // Cached sort column nr.
    let cacheSortOrder = null;  // Cached sort order.
    let i = 0;                  // Keep simultaneous requests from interfering.

    let get = async (args) => {
        // Check if we can use the cache.
        if (cache.length
         && currentFolder        === cacheFolder
         && args.order[0].dir    === cacheSortOrder
         && args.order[0].column === cacheSortCol
         && args.start               >= cacheStart
         && args.start + args.length <= cacheStart + batchSize) {

            return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length);
        } else {
            // Nope, load new data via the API.
            let j = ++i;
            let result = await Yoda.call('browse_folder',
                                         {'coll':       Yoda.basePath + currentFolder,
                                          'offset':     args.start,
                                          'limit':      batchSize,
                                          'sort_order': args.order[0].dir,
                                          'sort_on':    ['name','size','modified'][args.order[0].column],
                                          'space':      'Space.RESEARCH'});

            // If another requests has come while we were waiting, simply drop this one.
            if (i !== j) return null;

            // Populate the 'size' of collections so datatables doesn't get confused.
            for (let x of result.items)
                if (x.type === 'coll')
                    x.size = 0;

            // Update cache info.
            total          = result.total;
            cacheStart     = args.start;
            cache          = result.items;
            cacheFolder    = currentFolder;
            cacheSortCol   = args.order[0].column;
            cacheSortOrder = args.order[0].dir;

            return cache.slice(args.start - cacheStart, args.length);
        }
    };

    // The actual function passed to datatables.
    // (needs a non-async wrapper cause datatables won't accept it otherwise)
    let fn = (args, cb, settings) => (async () => {

        let data = await get(args);
        if (data === null)
            return;

        cb({'data':            data,
            'recordsTotal':    total,
            'recordsFiltered': total });
    })();

    // Allow manually clearing results (needed during soft-reload after uploading a file).
    fn.dropCache = () => cache = [];
    return fn;
})();

// Functions for rendering table cells, per column.
const tableRenderer = {
    name: (name, _, row) => {
         let tgt = `${currentFolder}/${name}`;
         if (row.type === 'coll')
              return `<a class="coll browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${htmlEncode(tgt)}"><i class="fa fa-folder-o"></i> ${htmlEncode(name)}</a>`;
         else return `<i class="fa fa-file-o"></i> ${htmlEncode(name)}`;
    },
    size: (size, _, row) => {
        if (row.type === 'coll') {
            return '';
        } else {
            let szs = ['B', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
            let szi = 0;
            while (size >= 1024 && szi < szs.length-1) {
                size /= 1024;
                szi++;
            }
            return (Math.floor(size*10)/10+'') + '&nbsp;' + szs[szi];
        }
    },
    date: ts => {
         let date = new Date(ts*1000);
         let pad = n => n < 10 ? '0'+n : ''+n;
         let elem = $('<span>');
         elem.text(`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
                 + ` ${pad(date.getHours())}:${pad(date.getMinutes())}`);
         elem.attr('title', date.toString()); // (should include seconds and TZ info)
         return elem[0].outerHTML;
     },
    context: (_, __, row) => {
        if (row.type === 'coll')
            return '';

        // Render context menu for files.
        const viewExts = {image: ['jpg', 'jpeg', 'gif', 'png'],
                          audio: ['mp3', 'ogg', 'wav'],
                          video: ['mp4', 'ogg', 'webm']};
        let ext = row.name.replace(/.*\./, '').toLowerCase();

        let actions = $('<ul class="dropdown-menu">');
        actions.append(`<li><a href="browse/download?filepath=${encodeURIComponent(currentFolder+'/'+row.name)}">Download</a>`);

        // Generate dropdown "view" actions for different media types.
        for (let type of Object.keys(viewExts).filter(type => (viewExts[type].includes(ext))))
            actions.append(`<li><a class="view-${type}" data-path="${htmlEncode(currentFolder+'/'+row.name)}">View</a>`);

        let dropdown = $(`<div class="dropdown">
                            <span class="dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                              <span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span>
                            </span>`);
        dropdown.append(actions);

        return dropdown[0].outerHTML;
    }
};

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
        //"processing": true,
        "processing": false,
        "serverSide": true,
        "iDeferLoading": 0,
        "pageLength": items
    });
    browse(currentFolder);
}

function toggleLocksList(folder)
{
    var isVisible = $('.lock-items').is(":visible");

    // toggle locks list
    if (isVisible) {
        $('.lock-items').hide();
    } else {
        // Get locks
        $.getJSON("browse/list_locks?folder=" + encodeURIComponent(folder), function (data) {
            $('.lock-items').hide();

            if (data.status == 'Success') {
                var html = '<li class="list-group-item disabled">Locks:</li>';
                var locks = data.result;
                $.each(locks, function (index, value) {
                    html += '<li class="list-group-item"><span class="browse" data-path="' + htmlEncode(value) + '">' + htmlEncode(value) + '</span></li>';
                });
                $('.lock-items').html(html);
                $('.lock-items').show();
            } else {
                setMessage('error', data.statusInfo);
            }

        });
    }
}

function toggleActionLogList(folder)
{
    let actionList = $('.actionlog-items');

    // toggle locks list
    if (actionList.is(":visible")) {
        actionList.hide();
    } else {
        buildActionLog(folder);
    }
}

function buildActionLog(folder)
{
    let actionList = $('.actionlog-items');

    // Get provenance information
    Yoda.call('provenance_log',
              {coll: Yoda.basePath + folder}).then((data) => {
        actionList.hide();

        var html = '<li class="list-group-item disabled">Provenance information:</li>';
        var logItems = data;
        if (logItems.length) {
            $.each(logItems, function (index, value) {
                html += '<li class="list-group-item"><span>'
                     + htmlEncode(value[2])
                     + ' - <strong>'
                     + htmlEncode(value[1])
                     + '</strong> - '
                     + htmlEncode(value[0])
                     + '</span></li>';
            });
        }
        else {
            html += '<li class="list-group-item">No provenance information present</li>';
        }
        actionList.html(html).show();
    });
}

function toggleSystemMetadata(folder)
{
    let systemMetadata = $('.system-metadata-items');
    let isVisible = systemMetadata.is(":visible");

    // Toggle system metadata.
    if (isVisible) {
        systemMetadata.hide();
    } else {
        // Retrieve system metadata of folder.
        Yoda.call('research_system_metadata',
                  {coll: Yoda.basePath + folder}).then((data) => {
            systemMetadata.hide();
            var html = '<li class="list-group-item disabled">System metadata:</li>';

            if (data) {
                $.each(data, function(index, value) {
                    html += '<li class="list-group-item"><span><strong>' +
                        htmlEncode(index) +
                        '</strong>: ' +
                        htmlEncode(value) +
                        '</span></li>';
                });
            } else {
                html += '<li class="list-group-item">No system metadata present</li>';
            }
            systemMetadata.html(html).show();
        });
    }
}

window.addEventListener('popstate', function(e) {
    // Catch forward/backward navigation and reload the view.
    let query = window.location.search.substr(1).split('&').reduce(
        function(acc, kv) {
            let xy = kv.split('=', 2);
            acc[xy[0]] = xy.length == 1 || decodeURIComponent(xy[1]);
            return acc;
        }, {});

    browse('dir' in query ? query.dir : '');
});

function topInformation(dir, showAlert)
{
    if (typeof dir != 'undefined') {
        Yoda.call('research_collection_details',
                  {path: Yoda.basePath + dir}).then((data) => {
            let statusText = "";
            var basename = data.basename;
            var status = data.status;
            var userType = data.member_type;
            var hasWriteRights = "yes";
            var isDatamanager = data.is_datamanager;
            var lockCount = data.lock_count;
            var vaultPath = data.vault_path;
            var actions = [];

            $('.btn-group button.metadata-form').hide();
            $('#upload').attr('data-path', "");
            $('.btn-group button.upload').prop("disabled", true);
            $('.top-information').hide();
            $('.top-info-buttons').hide();

            // Set folder status badge and actions.
            if (typeof status != 'undefined') {
                if (status == '') {
                    statusText = "";
                    actions['lock'] = 'Lock';
                    actions['submit'] = 'Submit';
                } else if (status == 'LOCKED') {
                    statusText = "Locked";
                    actions['unlock'] = 'Unlock';
                    actions['submit'] = 'Submit';
                } else if (status == 'SUBMITTED') {
                    statusText = "Submitted";
                    actions['unsubmit'] = 'Unsubmit';
                } else if (status == 'ACCEPTED') {
                    statusText = "Accepted";
                } else if (status == 'SECURED') {
                    statusText = "Secured";
                    actions['lock'] = 'Lock';
                    actions['submit'] = 'Submit';
                } else if (status == 'REJECTED') {
                    statusText = "Rejected";
                    actions['lock'] = 'Lock';
                    actions['submit'] = 'Submit';
                }

                // Show metadata button.
                $('.btn-group button.metadata-form').attr('data-path', dir);
                $('.btn-group button.metadata-form').show();

                // Enable uploads.
                if (status == '' || status == 'SECURED') {
                    $('#upload').attr('data-path', dir);
                    $('.btn-group button.upload').prop("disabled", false);
                }

                $('.btn-group button.folder-status').attr('data-datamanager', isDatamanager);
            }

            if (userType == 'reader') {
                var actions = [];
                hasWriteRights = 'no';
            }

            if (isDatamanager) {
                // Check rights as datamanager.
                if (userType != 'manager' && userType != 'normal') {
                    var actions = [];
                    hasWriteRights = 'no';
                }

                if (typeof status != 'undefined') {
                    if (status == 'SUBMITTED') {
                        actions['accept'] = 'Accept';
                        actions['reject'] = 'Reject';
                    }
                }
            }

            // Lock icon
            $('.lock-items').hide();
            var lockIcon = '';
            if (lockCount != '0' && typeof lockCount != 'undefined') {
                lockIcon = `<i class="fa fa-exclamation-circle lock-icon" data-folder="${htmlEncode(dir)}" data-locks="${lockCount}" title="${lockCount} lock(s) found" aria-hidden="true"></i>`;
            } else {
                lockIcon = `<i class="fa fa-exclamation-circle lock-icon hide" data-folder="${htmlEncode(dir)}" data-locks="0" title="0 lock(s) found" aria-hidden="true"></i>`;
            }

            // Provenance action log
            $('.actionlog-items').hide();
            let actionLogIcon = ` <i class="fa fa-book actionlog-icon" style="cursor:pointer" data-folder="${htmlEncode(dir)}" aria-hidden="true" title="Provenance action log"></i>`;

            // System metadata.
            $('.system-metadata-items').hide();
            let systemMetadataIcon = ` <i class="fa fa-info-circle system-metadata-icon" style="cursor:pointer" data-folder="${htmlEncode(dir)}" aria-hidden="true" title="System metadata"></i>`;

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
            let statusBadge = '<span id="statusBadge" class="badge">' + statusText + '</span>';

            // Reset action dropdown.
            $('.btn-group button.folder-status').prop("disabled", false).next().prop("disabled", false);

            var icon = '<i class="fa fa-folder-open-o" aria-hidden="true"></i>';
            $('.top-information h1').html(`<span class="icon">${icon}</span> ${folderName}${lockIcon}${systemMetadataIcon}${actionLogIcon}${statusBadge}`);

            // Show top information and buttons.
            if (typeof status != 'undefined') {
                $('.top-information').show();
                $('.top-info-buttons').show();
            }
        });
    } else {
        $('#upload').attr('data-path', "");
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
            html += '<li><a class="action-' + value + '" data-folder="' + htmlEncode(folder) + '">' + actions[value] + '</a></li>';
        }
    });

    $.each(possibleVaultActions, function( index, value ) {
        if (actions.hasOwnProperty(value)) {
            vaultHtml += '<li><a class="action-' + value + '" data-folder="' + htmlEncode(folder) + '">' + actions[value] + '</a></li>';
        }
    });

    if (html != '' && vaultHtml != '') {
        html += '<li class="divider"></li>' + vaultHtml;
    } else if (vaultHtml != '') {
        html += vaultHtml;
    }

    $('.action-list').html(html);
}

async function lockFolder(folder)
{
    // Get current button text
    var btnText = $('#statusBadge').html();
    $('#statusBadge').html('Lock <i class="fa fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    // Change folder status call

    try {
        await Yoda.call('folder_lock',
                        {'coll': Yoda.basePath + folder})
        // Set actions
        var actions = [];

        if ($('.actionlog-items').is(":visible")) {
            buildActionLog(folder);
        }

        $('#statusBadge').text('Locked');
        actions['unlock'] = 'Unlock';
        actions['submit'] = 'Submit';

        var totalLocks = $('.lock-icon').attr('data-locks');
        if (totalLocks == '0') {
            $('.lock-icon').removeClass('hide');
            $('.lock-icon').attr('data-locks', 1);
            $('.lock-icon').attr('title','1 lock(s) found');
        }
        setMessage('success', 'Successfully locked this folder');

        handleActionsList(actions, folder);
    } catch (e) {
        $('#statusBadge').html(btnText);
    }
    topInformation(folder, false);
}

async function unlockFolder(folder)
{
    // Get current button text
    let btnText = $('#statusBadge').html();
    $('#statusBadge').html('Unlock <i class="fa fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    try {
        await Yoda.call('folder_unlock',
                        {'coll': Yoda.basePath + folder});
        // Set actions
        let actions = [];

        if ($('.actionlog-items').is(":visible")) {
            buildActionLog(folder);
        }

        $('#statusBadge').text('');
        actions['lock'] = 'Lock';
        actions['submit'] = 'Submit';

        var totalLocks = $('.lock-icon').attr('data-locks');
        if (totalLocks == '1') {
            $('.lock-icon').addClass('hide');
            $('.lock-icon').attr('data-locks', 0);
        }

        // unlocking -> hide lock-items as there are none
        if ($('.lock-items').is(":visible")) {
            $('.lock-items').hide();
        }

        setMessage('success', 'Successfully unlocked this folder');

        handleActionsList(actions, folder);
    } catch (e) {
        $('#statusBadge').html(btnText);
    }
    topInformation(folder, false);
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
            let status = await Yoda.call('folder_submit',
                                         {'coll': Yoda.basePath + folder})
            if (status === 'SUBMITTED') {
                $('#statusBadge').html('Submitted');
            } else {
                $('#statusBadge').html('Accepted');
            }

            // lock icon
            let totalLocks = $('.lock-icon').attr('data-locks');
            if (totalLocks == '0') {
                $('.lock-icon').removeClass('hide');
                $('.lock-icon').attr('data-locks', 1);
                $('.lock-icon').attr('title', '1 lock(s) found');
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
            let status = await Yoda.call('folder_unsubmit',
                                         {'coll': Yoda.basePath + folder})
            $('#statusBadge').html('');
        } catch(e) {
            $('#statusBadge').html(btnText);
        }
        topInformation(folder, false);
    }
}

async function acceptFolder(folder)
{
    var btnText = $('#statusBadge').html();
    $('#statusBadge').html('Accept <i class="fa fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    try {
        await Yoda.call('folder_accept',
                                  {'coll': Yoda.basePath + folder})
        $('#statusBadge').html('Accepted');
    } catch (e) {
        $('#statusBadge').html(btnText);
    }
    topInformation(folder, false);
}

async function rejectFolder(folder)
{
    var btnText = $('#statusBadge').html();
    $('#statusBadge').html('Reject <i class="fa fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    try {
        await Yoda.call('folder_reject',
                        {'coll': Yoda.basePath + folder})
        $('#statusBadge').html('Rejected');
    } catch (e) {
        $('#statusBadge').html(btnText);
        setMessage('error', data.statusInfo);
    }
    topInformation(folder, false);
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
        if(file.size > 25*1024*1024) {
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
                    $("#" + id + " progress").val(0);
                    resolve(xhr.response);
                }
            } else {
                $("#" + id + " .msg").html("FAILED");
                $("#" + id + " progress").val(0);
                resolve(xhr.response);
            }
        }

        xhr.upload.addEventListener('progress', function(e) {
            var percent = parseInt((e.loaded / e.total) * 100);
            $("#" + id + " progress").val(percent);
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
                  <div class="col-md-3"><progress value="0" max="100"></progress></div>
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
