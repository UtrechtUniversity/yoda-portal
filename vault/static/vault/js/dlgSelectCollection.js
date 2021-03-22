var urlEncodedPath = '',
urlEncodedOrigin = '';
folderSelectBrowser = null;
dlgCurrentFolder = '';

$( document ).ready(function() {
    $("body").on("click",".dlg-browse", function(e) {

        console.log('Clicked ROW');
        console.log($(this).attr('data-path'));
        dlgBrowse($(this).attr('data-path'));

        // Dismiss stale messages.
        //$('#messages .close').click();
        e.preventDefault();
    });

    // handling of breadcrumbs
    $("body").on("click", ".browse-select", function(e) {
        dlgBrowse($(this).attr('data-path'));

        // Dismiss stale messages.
        //$('#messages .close').click();
        e.preventDefault();
    });

    $("body").on("click", "a.action-copy-vault-package-to-research", function() {

        dlgCurrentFolder = ''; // always initiatize when reopening the box
        dlgShowFolderSelectDialog($(this).attr('data-folder'));
    });

    $('#btn-copy-package').on('click', function(){
        copyVaultPackageToDynamic(urlEncodedOrigin, urlEncodedPath);
    })
});


/// --------------------- Dit moet mogelijk in research.js??
async function copyVaultPackageToDynamic(urlEncodedOrigin, urlEncodedTarget)
{
    dlgSelectAlertHide();

    // console.log('COPY FROM: ' + urlEncodedOrigin);
    // console.log('COPY TO: ' + dlgCurrentFolder);

    if (typeof urlEncodedOrigin == 'undefined') {
        errorMessage = 'Please select a package from the vault';
        dlgSelectAlertShow(errorMessage);
        return;
    }
    if (typeof urlEncodedTarget == 'undefined') {
        errorMessage = 'The home folder cannot be used for restoration purposes. Please choose another folder';
        dlgSelectAlertShow(errorMessage);
        return;
    }

    if (urlEncodedOrigin.indexOf('/vault-')!=0) {
        dlgSelectAlertShow('Origin must be vault folder. Please choose another folder');
        return;
    }
    //
    // Target CAN NOT be vault folder!
    if (urlEncodedTarget.indexOf('/Fvault-')==0) {
        dlgSelectAlertShow('Target can not be vault folder. Please select again');
        return;
    }

    // console.log('COPY FROM: ' + urlEncodedOrigin);
    // console.log('COPY TO: ' + dlgCurrentFolder);
    //
    //window.location.href = '/research/?dir=' + dlgCurrentFolder;

    try {
        let result = await Yoda.call('vault_copy_to_research',
            {
                'coll_target': Yoda.basePath + dlgCurrentFolder,
                'coll_origin': Yoda.basePath + urlEncodedOrigin
            },
            {'quiet': true}
        );

        if (result.status == 'ok') {
            html = 'Datapackage succesfully registered for copying to research area. Actual copying will start soon';
            html += ' <a href="/research/?dir=' + dlgCurrentFolder + '">Go to research area</a>';
            dlgSelectAlertShow(html);
        }
        else { // non api error
            dlgSelectAlertShow(result.status_info);
        }
    } catch(e) { // API ERROR
        dlgSelectAlertShow(e.status_info);
    }
}




/// ----------------- Basic functions for Dialog

// functions for handling of folder selection - easy point of entry for select-folder functionality from the panels within dataTables
// objectid is the Id of the revision that has to be restored
function dlgShowFolderSelectDialog(orgPath)
{
    urlEncodedOrigin = orgPath;

    path = ''; //start in root as user is in Vault now

//   path = Yoda.basePath;

    //startBrowsingFolderSelect(path, browseDlgPageItems); //org
    startBrowsing2(path, browseDlgPageItems);

    // initialisation of alerts/warning thins -> to be taken out
    $('.mode-dlg-locked').addClass('hide');
    $('.mode-dlg-exists').addClass('hide');
    $('.alert-panel-overwrite').addClass('hide');
    $('.cover').addClass('hide');
    $('.revision-restore-dialog').removeClass('hide');

    $('#dlg-select-folder').modal('show');
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

function startBrowsing2(items)  // deze draait om currentFolder
{
    console.log("startBrowsing2");
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
    //browse(currentFolder);
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

    console.log('IN getFOlderOCNtents2');

    let get = async (args) => {
        // Check if we can use the cache.
        if (cache.length
            && dlgCurrentFolder        === cacheFolder
            && args.order[0].dir    === cacheSortOrder
            && args.order[0].column === cacheSortCol
            && args.start               >= cacheStart
            && args.start + args.length <= cacheStart + batchSize) {

            console.log('TAKE FROM CACHE');

            return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length);
        } else {
            // Nope, load new data via the API.
            let j = ++i;

            console.log('NONE CACHE' + Yoda.basePath + dlgCurrentFolder);
            // + currentFolder
            let result = await Yoda.call('browse_collections',
                {'coll':       Yoda.basePath + dlgCurrentFolder,
                    'offset':     args.start,
                    'limit':      batchSize,
                    'sort_order': args.order[0].dir,
                    'sort_on':    ['name','size','modified'][args.order[0].column],
                    'space':      'Space.RESEARCH'});

            console.log(result);

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
    console.log('GEKLIKT: '+ dir);
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
    console.log('AJAX RELOAD');
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
        var html = '<li class="browse-select" data-path="">Home</li>'; // HdR added to differentiate from main browser and avoid collisions
        var path = "";
        $.each( parts, function( k, part ) {
            path += '/' + encodeURIComponent(part);

            // Active item
            valueString = htmlEncode(part).replace(/ /g, "&nbsp;");
            if (k == (totalParts-1)) {
                html += '<li class="active">' + valueString + '</li>';
            } else {
                html += '<li class="browse-select" data-path="' + path + '">' + valueString + '</li>'; // HdR added to differentiate from main browser and avoid collisions
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
