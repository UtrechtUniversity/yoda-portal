var folderSelectBrowser = null;
var dlgCurrentFolder = '';

$( document ).ready(function() {
    $("body").on("click", "a.file-copy, a.file-move", function() {
        // Determine action
        if($(this).hasClass("file-move")) {
            $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'move');
            $('#dlg-file-browse-operations .dlg-action-button span.action').text('Move');
            $('#dlg-file-browse-operations .card-title span.action').text('move');
        } else {
            $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'copy');
            $('#dlg-file-browse-operations .dlg-action-button span.action').text('Copy');
            $('#dlg-file-browse-operations .card-title span.action').text('copy');
        }

        // Set filename in modal & button attribute
        $('#dlg-file-browse-operations span.action-file').text($(this).attr('data-name'));
        $('#dlg-file-browse-operations .dlg-action-button').attr('data-name', $(this).attr('data-name'));
        $('#dlg-file-browse-operations .dlg-action-button').attr('data-collection', $(this).attr('data-collection'));

        // Set current folder & initiate browse object.
        dlgCurrentFolder = $(this).attr('data-collection');
        dlgSelectAlertHide();
        startBrowsing2();

        $('#dlg-file-browse-operations').modal('show');
    });

    // handling of breadcrumbs
    $("body").on("click", ".browse-select", function(e) {
        dlgBrowse($(this).attr('data-path'));
        e.preventDefault();
    });

    $("body").on("click",".dlg-browse", function(e) {
        dlgBrowse($(this).attr('data-path'));

        // Dismiss stale messages.
        e.preventDefault();
    });

    $('.dlg-action-button').on('click', function(){
        let filepath = $(this).attr('data-collection') + "/" + $(this).attr('data-name');
        let newFilepath = dlgCurrentFolder + "/" + $(this).attr('data-name');

        if($(this).attr("data-action") == 'move') {
            moveFile(filepath, newFilepath);
        } else if ($(this).attr("data-action") == 'copy') {
            copyFile(filepath, newFilepath);
        }
    })

});

async function copyFile(filepath, newFilepath)
{
    dlgSelectAlertHide();

    try {
        let result = await Yoda.call('research_file_copy',
            {
                'filepath': Yoda.basePath + filepath,
                'new_filepath': Yoda.basePath + newFilepath
            },
            {'quiet': true, 'rawResult': true}
        );

        if (result.status == 'ok') {
            Yoda.set_message('success', 'The file has been successfully copied.');
            $('#dlg-file-browse-operations').modal('hide');
        }
        else { // non api error
            dlgSelectAlertShow(result.status_info);
        }
    } catch(e) { // API ERROR
        dlgSelectAlertShow(e.status_info);
    }
}

async function moveFile(filepath, newFilepath)
{
    dlgSelectAlertHide();

    try {
        let result = await Yoda.call('research_file_move',
            {
                'filepath': Yoda.basePath + filepath,
                'new_filepath': Yoda.basePath + newFilepath
            },
            {'quiet': true, 'rawResult': true}
        );

        if (result.status == 'ok') {
            Yoda.set_message('success', 'The file has been successfully moved.');
            $('#dlg-file-browse-operations').modal('hide');
            let collection = $('#dlg-file-browse-operations .dlg-action-button').attr('data-collection');
            browse(collection, true);
        }
        else { // non api error
            dlgSelectAlertShow(result.status_info);
        }
    } catch(e) { // API ERROR
        dlgSelectAlertShow(e.status_info);
    }
}

function startBrowsing2(items)  // deze draait om currentFolder
{
    if (!folderSelectBrowser) {
        folderSelectBrowser = $('#folder-select-browser').DataTable({
            "bFilter": false,
            "bInfo": false,
            "bLengthChange": true,
            "language": {
                "emptyTable": "No accessible files/folders present",
                "lengthMenu": "_MENU_"
            },
            "dom": '<"top">frt<"bottom"lp><"clear">',
            'columns': [{render: tableRenderer2.name, data: 'name'},
                // Size and date should be orderable, but limitations
                // on how queries work prevent us from doing this
                // correctly without significant overhead.
                // (enabling this as is may result in duplicated results for data objects)
                //{render: tableRenderer.size,    orderable: false, data: 'size'},
                {render: tableRenderer2.date, orderable: false, data: 'modify_time'}],
            //{render: tableRenderer.context, orderable: false }],
            "ajax": getFolderContents2,
            "processing": true,
            "serverSide": true,
            "iDeferLoading": 0,
            "pageLength": 10
        });
    }
    dlgBrowse(dlgCurrentFolder);
}

// Fetches directory contents to populate the listing table.
let getFolderContents2 = (() => {
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
            && dlgCurrentFolder        === cacheFolder
            && args.order[0].dir    === cacheSortOrder
            && args.order[0].column === cacheSortCol
            && args.start               >= cacheStart
            && args.start + args.length <= cacheStart + batchSize) {

            return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length);
        } else {
            // Nope, load new data via the API.
            let j = ++i;

            // + currentFolder
            let result = await Yoda.call('browse_folder',
                {'coll':       Yoda.basePath + dlgCurrentFolder,
                    'offset':     args.start,
                    'limit':      batchSize,
                    'sort_order': args.order[0].dir,
                    'sort_on':    ['name','size','modified'][args.order[0].column],
                    'space':      'Space.RESEARCH'});

            // If another requests has come while we were waiting, simply drop this one.
            if (i !== j) return null;

            // Populate the 'size' of collections so datatables doesn't get confused.
            for (let x of result.items) {
                if (x.type === 'coll')
                    x.size = 0;
            }

            // Update cache info.
            total          = result.total;
            cacheStart     = args.start;
            cache          = result.items;
            cacheFolder    = dlgCurrentFolder;
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



const tableRenderer2 = {
    name: (name, _, row) => {
        let tgt = `${dlgCurrentFolder}/${name}`;
        if (row.type === 'coll')
            return `<a class="coll dlg-browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${htmlEncode(tgt)}"><i class="fa fa-folder-o"></i> ${htmlEncode(name)}</a>`;
        else
            return `<i class="fa fa-file-o"></i> ${htmlEncode(name)}`;
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
        actions.append(`<li><a href="browse/download?filepath=${encodeURIComponent(dlgCurrentFolder+'/'+row.name)}">Download</a>`);

        // Generate dropdown "view" actions for different media types.
        for (let type of Object.keys(viewExts).filter(type => (viewExts[type].includes(ext))))
            actions.append(`<li><a class="view-${type}" data-path="${htmlEncode(dlgCurrentFolder+'/'+row.name)}">View</a>`);

        let dropdown = $(`<div class="dropdown">
                                <span class="dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                  <span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span>
                                </span>`);
        dropdown.append(actions);

        return dropdown[0].outerHTML;
    }
};




function dlgBrowse(dir)
{
    dlgCurrentFolder = dir;

    dlgSelectAlertHide();

    dlgMakeBreadcrumb(dir);

    dlgChangeBrowserUrl(dir);

    dlgBuildFileBrowser(dir);
}


function dlgChangeBrowserUrl(path)
{
    //currentFolder =   path;
    urlEncodedPath = path;
}

function dlgBuildFileBrowser(dir)
{
    //let fileBrowser = $('#file-browser').DataTable();
    getFolderContents2.dropCache();
    folderSelectBrowser.ajax.reload();


//     var url = "browse/selectData/collections/org_lock_protect";
//     if (typeof dir != 'undefined') {
//         url += "?dir=" +  dir;
//     }
//
//     folderSelectBrowser.ajax.url(url).load();
//
//     return true;
}

function dlgMakeBreadcrumb(urlEncodedDir)
{
//    var dir = decodeURIComponent((urlEncodedDir + '').replace(/\+/g, '%20'));
    var dir = urlEncodedDir;

    var parts = [];
    if (typeof dir != 'undefined') {
        if (dir.length > 0) {
            var elements = dir.split('/');

            // Remove empty elements
            var parts = $.map(elements, function (v) {
                return v === "" ? null : v;
            });
        }
    }

    // Build html
    var totalParts = parts.length;

    if (totalParts > 0 && parts[0]!='undefined') {
        var html = '<li class="browse-select breadcrumb-item" data-path="">Home</li>'; // HdR added to differentiate from main browser and avoid collisions
        var path = "";
        $.each( parts, function( k, part ) {
            path += '/' + encodeURIComponent(part);

            // Active item
            valueString = htmlEncode(part).replace(/ /g, "&nbsp;");
            if (k == (totalParts-1)) {
                html += '<li class="active breadcrumb-item">' + valueString + '</li>';
            } else {
                html += '<li class="browse-select breadcrumb-item" data-path="' + path + '">' + valueString + '</li>'; // HdR added to differentiate from main browser and avoid collisions
            }
        });
    } else {
        var html = '<li class="active">Home</li>';
    }

    $('ol.dlg-breadcrumb').html(html);
}

function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

/// alert handling
function dlgSelectAlertShow(errorMessage)
{
    $('#dlg-select-alert-panel').removeClass('hide');
    $('#dlg-select-alert-panel span').html(errorMessage);
}

function dlgSelectAlertHide()
{
    $('#dlg-select-alert-panel').addClass('hide');
}