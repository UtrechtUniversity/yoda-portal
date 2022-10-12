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
let dataPackage = null;

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

    $("body").on("click", "a.view-video", function() {
        let path = $(this).attr('data-path');
        let viewerHtml = `<video width="640" controls autoplay><source src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}"></video>`;
        $('#viewer').html(viewerHtml);
        $('#viewMedia').modal('show');
    });

    $("body").on("click", "a.view-audio", function() {
        let path = $(this).attr('data-path');
        let viewerHtml = `<audio width="640" controls autoplay><source src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}"></audio>`;
        $('#viewer').html(viewerHtml);
        $('#viewMedia').modal('show');
    });

    $("body").on("click", "a.view-image", function() {
        let path = $(this).attr('data-path');
        let viewerHtml = `<img width="640" src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}" />`;
        $('#viewer').html(viewerHtml);
        $('#viewMedia').modal('show');
    });

    $("#viewMedia.modal").on("hidden.bs.modal", function() {
        $("#viewer").html("");
    });

    // Show checksum report
    $("body").on("click", "a.action-show-checksum-report", function() {
        let folder = $(this).attr('data-folder');
        let download_url = 'browse/download_checksum_report?path=' + encodeURIComponent(folder);

        $('#showChecksumReport .collection').text(folder);
        $('#showChecksumReport .modal-body #checksumReport').html('');
        $('#showChecksumReport .modal-footer .download-report-text').attr('href', download_url + '&format=text');
        $('#showChecksumReport .modal-footer .download-report-csv').attr('href', download_url + '&format=csv');

        Yoda.call('research_manifest',
            {coll: Yoda.basePath + folder}).then((data) => {
            let table = '<table class="table table-striped"><tbody>';

            table += '<thead><tr><th>Filename</th><th>Checksum</th></thead>';
            $.each(data, function( index, obj ) {
                table += `<tr>
                     <td>${obj.name}</td>
                     <td>${obj.checksum}</td>
                </tr>`;
            });
            table += '</tbody></table>';

            $('#showChecksumReport .modal-body #checksumReport').html(table);
            $('#showChecksumReport').modal('show');
        });
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

    $("body").on("click", "a.action-submit-for-publication", function() {
        $('.action-confirm-submit-for-publication').attr( 'data-folder', $(this).attr('data-folder') );

        let folder = $(this).attr('data-folder');
        let vault = String(folder.match(/.*\//)).replace(/\/+$/, '');
        dataPackage = null;
        $('.previousPublications').html('');
        Yoda.call('vault_get_published_packages', {path: Yoda.basePath + vault}).then((data) => {
            if (data) {
                let i = 0;
                $.each(data, function(doi, path) {
                    i++;
                    let vault_path = path.replace(Yoda.basePath, '');
                    $('.previousPublications').append(`
<div class="form-check">
  <input class="form-check-input" type="radio" name="dataPackageSelect" id="dataPackage${i}" value="${htmlEncode(path)}">
  <label class="form-check-label" for="dataPackage${i}">
    ${htmlEncode(doi)} (<a target="_blank" href="?dir=${encodeURIComponent(vault_path)}">${htmlEncode(vault_path)}</a>)
  </label>
</div>
`);
                });
            } else {
                $('.previousPublications').html("No previously published data packages available.");
            }

            $('#submitPublication').modal('show');
        });
    });

    $("body").on("click", "button.action-confirm-data-package-select", function() {
        dataPackage = $('#submitPublication .modal-body input[type="radio"]:checked').val();
        $('#submitPublication').modal('hide');

        $('#confirmAgreementConditions .modal-body').text(''); // clear it first

        Yoda.call('vault_get_publication_terms', {}).then((data) => {
            $('#confirmAgreementConditions .modal-body').html(data);

            // Set default status and show dialog.
            $(".action-confirm-submit-for-publication").prop('disabled', true);
            $("#confirmAgreementConditions .confirm-conditions").prop('checked', false);

            $('#confirmAgreementConditions').modal('show');
        });
    });

    $("#confirmAgreementConditions").on("click", '.confirm-conditions', function() {
        if ($(this).prop('checked')) {
            $("#confirmAgreementConditions .action-confirm-submit-for-publication").prop('disabled', false);;
        }
        else {
            $("#confirmAgreementConditions .action-confirm-submit-for-publication").prop('disabled', true);
        }
    });

    $("#confirmAgreementConditions").on("click", ".action-confirm-submit-for-publication", function() {
        $('#confirmAgreementConditions').modal('hide');
        vaultSubmitForPublication($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-approve-for-publication", function() {
        vaultApproveForPublication($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-cancel-publication", function() {
        vaultCancelPublication($(this).attr('data-folder'));
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

    $("body").on("click", "a.action-grant-vault-access", function() {
        vaultAccess('grant', $(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-revoke-vault-access", function() {
        vaultAccess('revoke', $(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-depublish-publication", function() {
        // Set the current folder.
        $('.action-confirm-depublish-publication').attr( 'data-folder', $(this).attr('data-folder') );
        // Show depublish modal.
        $('#confirmDepublish').modal('show');
    });

    $("#confirmDepublish").on("click", ".action-confirm-depublish-publication", function() {
        $('#confirmDepublish').modal('hide');
        vaultDepublishPublication($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-republish-publication", function() {
        // Set the current folder.
        $('.action-confirm-republish-publication').attr( 'data-folder', $(this).attr('data-folder') );
        // Show depublish modal.
        $('#confirmRepublish').modal('show');
    });

    $("#confirmRepublish").on("click", ".action-confirm-republish-publication", function() {
        $('#confirmRepublish').modal('hide');
        vaultRepublishPublication($(this).attr('data-folder'));
    });

    $("body").on("click", "a.action-go-to-research", function() {
        window.location.href = '/research/?dir=' + encodeURIComponent('/'+$(this).attr('research-path'));
    });

    // FILE stage
    $("body").on("click", "a.file-stage", function() {
        handleFileStage($(this).attr('data-collection'), $(this).attr('data-name'));
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
    metadataInfo(dir);
    topInformation(dir, true); //only here topInformation should show its alertMessage
    buildFileBrowser(dir);
}

function makeBreadcrumb(dir)
{
    let pathParts = dir.split('/').filter(x => x.length);

    // [[Crumb text, Path]] - e.g. [...['x', '/research-a/x']]
    let crumbs = [['Vault', ''],
                  ...Array.from(pathParts.entries())
                          .map(([i,x]) => [x, '/'+pathParts.slice(0, i+1).join('/')])];

    let html = '';
    for (let [i, [text, path]] of crumbs.entries()) {
        let el = $('<li class="breadcrumb-item">');
        text = htmlEncode(text).replace(/ /g, '&nbsp;');
        if (i === crumbs.length-1)
             el.addClass('active').html(text);
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
                                          'space':      'Space.VAULT'});

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
              return `<a class="coll browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${htmlEncode(tgt)}"><i class="fa-regular fa-folder"></i> ${htmlEncode(name)}</a>`;
         else return `<i class="fa-regular fa-file"></i> ${htmlEncode(name)}`;
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
    state: (_, __, row) => {
        let state = $('<span>');
        if (row.type === 'data' && row.state === 'OFL') {
            state = $('<span class="badge bg-secondary" title="Stored offline on tape archive">Offline</span>');
        } else if (row.type === 'data' && row.state === 'UNM') {
            state = $('<span class="badge bg-secondary" title="Migrating from tape archive to disk">Bringing online</span>');
        } else if (row.type === 'data' && row.state === 'MIG') {
            state = $('<span class="badge bg-secondary" title="Migrating from disk to tape archive">Storing offline</span>');
        }
        return state[0].outerHTML;
    },
    context: (_, __, row) => {
        let actions = $('<div class="dropdown-menu">');

        if (row.type === 'coll')
            return '';

        if (row.state === 'OFL') {
            actions.append(`<a href="#" class="dropdown-item file-stage" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Bring this file online">Bring online</a>`);
        } else if (row.state === 'MIG' || row.state === 'UNM') {
            // no context menu for data objects migrating from or to tape archive
            return ''
        } else {
            // Render context menu for files.
            const viewExts = {
                image: ['jpg', 'jpeg', 'gif', 'png', 'webp'],
                audio: ['aac', 'flac', 'mp3', 'ogg', 'wav'],
                video: ['mp4', 'ogg', 'webm']
            };
            let ext = row.name.replace(/.*\./, '').toLowerCase();

            actions.append(`<a class="dropdown-item" href="browse/download?filepath=${encodeURIComponent(currentFolder + '/' + row.name)}" title="Download this file">Download</a>`);

            // Generate dropdown "view" actions for different media types.
            for (let type of Object.keys(viewExts).filter(type => (viewExts[type].includes(ext)))) {
                actions.append(`<a class="dropdown-item view-${type}" data-path="${htmlEncode(currentFolder + '/' + row.name)}" title="View this file">View</a>`);
            }
        }

        let dropdown = $(`<div class="dropdown">
                            <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-name="${htmlEncode(row.name)}" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                              <i class="fa-solid fa-ellipsis-h" aria-hidden="true"></i>
                            </button>`);
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
                    {render: tableRenderer.state,   orderable: false},
                    {render: tableRenderer.context, orderable: false }],
        "ajax": getFolderContents,
        "processing": true,
        "serverSide": true,
        "iDeferLoading": 0,
        "pageLength": items
    });
    browse(currentFolder);
}

function toggleActionLogList(folder)
{
    let actionList = $('.actionlog');
    let actionListItems = $('.actionlog-items');

    let isVisible = actionList.is(":visible");

    // toggle locks list
    if (isVisible) {
        actionList.hide();
    } else {
        // Get provenance information
        Yoda.call('provenance_log', {coll: Yoda.basePath + folder}).then((data) => {
            actionList.hide();
            var html = '';
            if (data.length) {
                $.each(data, function (index, value) {
                    html += '<a class="list-group-item list-group-item-action">'
                         + htmlEncode(value[2])
                         + ' - <strong>'
                         + htmlEncode(value[1])
                         + '</strong> - '
                         + htmlEncode(value[0])
                         + '</a>';
                });
            } else {
                html += '<a class="list-group-item list-group-item-action">No provenance information present</a>';
            }
            actionListItems.html(html)
            actionList.show();
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
        Yoda.call('vault_system_metadata', {coll: Yoda.basePath + folder}).then((data) => {
            systemMetadata.hide();
            var html = '';
            if (data) {
                $.each(data, function(index, value) {
                    html += '<span class="list-group-item list-group-item-action"><strong>' +
                        htmlEncode(index) +
                        '</strong>: ' +
                        value +
                        '</span>';
                });
            } else {
                html += '<a class="list-group-item list-group-item-action">No system metadata present</a>';
            }
            systemMetadataItems.html(html);
            systemMetadata.show();
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

function topInformation(dir, showAlert) {
    if (typeof dir != 'undefined') {
        Yoda.call('vault_collection_details',
                  {path: Yoda.basePath + dir}).then((data) => {
            var statusText = "";
            var basename = data.basename;
            var metadata = data.metadata;
            var vaultStatus = data.status;
            var vaultActionPending = data.vault_action_pending;
            var hasWriteRights = "yes";
            var hasDatamanager = data.has_datamanager;
            var isDatamanager = data.is_datamanager;
            var researchGroupAccess = data.research_group_access;
            var researchPath = data.research_path;
            var actions = [];

            $('.btn-group button.metadata-form').hide();
            $('.top-information').hide();
            $('.top-info-buttons').hide();

            // is vault package
            if (typeof vaultStatus != 'undefined') {
                actions['copy-vault-package-to-research'] = 'Copy datapackage to research space';

                // folder status (vault folder)
                if (typeof vaultStatus != 'undefined' && typeof vaultActionPending != 'undefined') {
                    $('.btn-group button.folder-status').attr('data-datamanager', isDatamanager);

                    // Set status badge.
                    if (vaultStatus == 'SUBMITTED_FOR_PUBLICATION') {
                        statusText = "Submitted for publication";
                    } else if (vaultStatus == 'APPROVED_FOR_PUBLICATION') {
                        statusText = "Approved for publication";
                    } else if (vaultStatus == 'PUBLISHED') {
                        statusText = "Published";
                    } else if (vaultStatus == 'DEPUBLISHED') {
                        statusText = "Depublished";
                    } else if (vaultStatus == 'PENDING_DEPUBLICATION') {
                        statusText = "Depublication pending";
                    } else if (vaultStatus == 'PENDING_REPUBLICATION') {
                        statusText = "Republication pending";
                    } else {
                        statusText = "Unpublished";
                    }

                    // Set actions for datamanager and researcher.
                    if (!vaultActionPending) {
                        if (isDatamanager) {
                            if (vaultStatus == 'SUBMITTED_FOR_PUBLICATION') {
                                actions['cancel-publication'] = 'Cancel publication';
                                actions['approve-for-publication'] = 'Approve for publication';
                            } else if (vaultStatus == 'UNPUBLISHED') {
                                actions['submit-for-publication'] = 'Submit for publication';
                            } else if (vaultStatus == 'PUBLISHED') {
                                actions['depublish-publication'] = 'Depublish publication';
                            } else if (vaultStatus == 'DEPUBLISHED') {
                                actions['republish-publication'] = 'Republish publication';
                            }
                        } else if (hasDatamanager) {
                            if (vaultStatus == 'UNPUBLISHED') {
                                actions['submit-for-publication'] = 'Submit for publication';
                            } else if (vaultStatus == 'SUBMITTED_FOR_PUBLICATION') {
                                actions['cancel-publication'] = 'Cancel publication';
                            }
                        }
                    }

                    // Show metadata button.
                    $('.btn-group button.metadata-form').attr('data-path', dir);
                    $('.btn-group button.metadata-form').show();
                }

                // Datamanager sees access buttons in vault.
                $('.top-info-buttons').show();
                if (isDatamanager) {
                    if (researchGroupAccess) {
                        actions['revoke-vault-access'] = 'Revoke read access to research group';
                    } else {
                        actions['grant-vault-access'] = 'Grant read access to research group';
                    }
                }
            }

            // Provenance action log
            $('.actionlog').hide();
            let actionLogIcon = ` <i class="fa-solid fa-book actionlog-icon" data-folder="${htmlEncode(dir)}" aria-hidden="true" title="Show provenance information"></i>`;

            // System metadata.
            $('.system-metadata').hide();
            let systemMetadataIcon = ` <i class="fa-solid fa-info-circle system-metadata-icon" data-folder="${htmlEncode(dir)}" aria-hidden="true" title="Show system metadata"></i>`;

            $('.btn-group button.folder-status').attr('data-write', hasWriteRights);

            // Add unpreservable files check to actions.
            actions['check-for-unpreservable-files'] = 'Check for compliance with policy';

            // Add checksum report
            actions['show-checksum-report'] = 'Show checksum report';

            // Add go to research to actions.
            if (typeof researchPath != 'undefined') {
                actions['go-to-research'] = 'Go to research';
            }

            // Handle actions
            handleActionsList(actions, dir);

            // Set research path.
            if (typeof researchPath != 'undefined') {
                $('a.action-go-to-research').attr('research-path', researchPath);
            }

            let folderName = htmlEncode(basename).replace(/ /g, "&nbsp;");
            let statusBadge = '<span id="statusBadge" class="ml-2 badge rounded-pill bg-primary">' + statusText + '</span>';

            // Reset action dropdown.
            $('.btn-group button.folder-status').prop("disabled", false).next().prop("disabled", false);

            // Folder buttons
            $('.top-information h2').html(`${statusBadge}${systemMetadataIcon}${actionLogIcon}`);

            // Show top information and buttons.
            if (typeof vaultStatus != 'undefined') {
                $('.top-information').show();
                $('.top-info-buttons').show();
            }
        });
    } else {
        $('.top-information').hide();
    }
}

function handleActionsList(actions, folder)
{
    var html = '';
    var vaultHtml = '';
    var possibleActions = ['submit-for-publication', 'cancel-publication',
                           'approve-for-publication', 'depublish-publication',
                           'republish-publication'];

    var possibleVaultActions = ['grant-vault-access', 'revoke-vault-access',
                                'copy-vault-package-to-research',
                                'check-for-unpreservable-files',
                                'show-checksum-report',
                                'go-to-research'];

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

async function vaultSubmitForPublication(folder)
{
    var btnText = $('#statusBadge').html();
    $('#statusBadge').html('Submit for publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    try {
        if (dataPackage) {
            let status = await Yoda.call('vault_submit', {'coll': Yoda.basePath + folder, 'previous_version': dataPackage})
        } else {
            let status = await Yoda.call('vault_submit', {'coll': Yoda.basePath + folder})
        }
        $('#statusBadge').html('');
    } catch(e) {
        $('#statusBadge').html(btnText);
    }
    topInformation(folder, false);
}

async function vaultApproveForPublication(folder)
{
    var btnText = $('#statusBadge').html();
    $('#statusBadge').html('Approve for publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    try {
        let status = await Yoda.call('vault_approve',
                                     {'coll': Yoda.basePath + folder})
        $('#statusBadge').html('');
    } catch(e) {
        $('#statusBadge').html(btnText);
    }
    topInformation(folder, false);
}

async function vaultCancelPublication(folder)
{
    var btnText = $('#statusBadge').html();
    $('#statusBadge').html('Cancel publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    try {
        let status = await Yoda.call('vault_cancel',
                                     {'coll': Yoda.basePath + folder})
        $('#statusBadge').html('');
    } catch(e) {
        $('#statusBadge').html(btnText);
    }
    topInformation(folder, false);
}

async function vaultDepublishPublication(folder)
{
    var btnText = $('#statusBadge').html();
    $('#statusBadge').html('Depublish publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    try {
        let status = await Yoda.call('vault_depublish',
                                     {'coll': Yoda.basePath + folder})
        $('#statusBadge').html('');
    } catch(e) {
        $('#statusBadge').html(btnText);
    }
    topInformation(folder, false);
}

async function vaultRepublishPublication(folder)
{
    var btnText = $('#statusBadge').html();
    $('#statusBadge').html('Republish publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>');
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    try {
        let status = await Yoda.call('vault_republish',
                                     {'coll': Yoda.basePath + folder})
        $('#statusBadge').html('');
    } catch(e) {
        $('#statusBadge').html(btnText);
    }
    topInformation(folder, false);
}

function vaultAccess(action, folder)
{
    $('.btn-group button.folder-status').prop("disabled", true).next().prop("disabled", true);

    $.post("access", {"path" : decodeURIComponent(folder), "action" : action}, function(data) {
        if (data.data.status != 'Success') {
            Yoda.set_message('error', data.statusInfo);
        }

        topInformation(folder, false);
    }, "json");
}

async function handleFileStage(collection, file_name) {
    let result = await Yoda.call('tape_archive_stage',
        {path: Yoda.basePath +  collection + "/" + file_name},
        {'quiet': true, 'rawResult': true}
    );

    if (result.status == 'ok') {
        Yoda.set_message('success', 'Successfully requested to bring file <' + file_name + '> online');
    }
    else {
        Yoda.set_message('error', 'Failed to request to bring file <' + file_name + '> online');
    }
}

function metadataInfo(dir) {
    /* Loads metadata of the vault packages */
    let pathParts = dir.split('/');

    // Do not show metadata outside data package.
    if (pathParts.length < 3) {
        $('.metadata-info').hide();
        return;
    } else {
        pathParts.length = 3;
        dir = pathParts.join("/");
    }

    try {
        Yoda.call('meta_form_load',
            {coll: Yoda.basePath + dir},
            {rawResult: true})
        .then((result) => {
            if (!result || jQuery.isEmptyObject(result.data))
                return console.info('No result data from meta_form_load');

            let metadata = result.data.metadata;
            $('.metadata-info').show();
            $(".metadata-title").text(metadata.Title);
            $(".metadata-access").text(metadata.Data_Access_Restriction);
            $(".metadata-data-classification").text(metadata.Data_Classification);
            $(".metadata-license").text(metadata.License);

            if (metadata.Description){
                let description = metadata.Description;
                let wordCount = description.match(/(\w+)/g). length;
                if (wordCount < 50 ){
                    $(".metadata-description").text(description);
                } else {
                    $(".metadata-description").text(truncate(description, 50));
                    $('.read-more-button').show();
                    $('.read-more-button').on('click', function(){
                        $(".metadata-description").text(description);
                        $('.read-more-button').hide();
                        $('.read-less-button').show();
                    })
                    $('.read-less-button').on('click', function(){
                        $(".metadata-description").text(truncate(description, 50));
                        $('.read-more-button').show();
                        $('.read-less-button').hide();
                    })
                }
            }

            let creators = [];
            for (let c in metadata.Creator){
                let fullname = "";
                if(typeof metadata.Creator[c].Name == 'string')
                    fullname = metadata.Creator[c].Name;
                else if(typeof metadata.Creator[c].Name == 'object')
                    fullname = "".concat(metadata.Creator[c].Name.Given_Name, " ", metadata.Creator[c].Name.Family_Name);
                creators.push(fullname);
            }
            $('.metadata-creator').text(creators.join(', '));
        });
    }
    catch (error) {
        console.error(error);
    }
}

function truncate(str, nr_words) {
    // Truncate string on n number of words
    return str.split(" ").splice(0,nr_words).join(" ");
}
