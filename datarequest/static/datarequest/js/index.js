$(document).ajaxSend(function(e, request, settings) {
    // Append a CSRF token to all AJAX POST requests.
    if (settings.type === 'POST' && settings.data.length) {
         settings.data
             += '&' + encodeURIComponent(YodaPortal.csrf.tokenName)
              + '=' + encodeURIComponent(YodaPortal.csrf.tokenValue);
    }
});

let currentFolder;

$( document ).ready(function() {
    if ($('#file-browser').length) {
        currentFolder = '/tempZone/home/datarequests-research';
        startBrowsing(config.items);
    }
});

function buildFileBrowser() {
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
            let result = await Yoda.call('datarequest_browse',
                                         {'offset':      args.start,
                                          'limit':       batchSize,
                                          'archived':    config.archived,
                                          'dacrequests': config.dacrequests,
                                          'sort_order':  args.order[0].dir,
                                          'sort_on':     ['name', 'modified'][args.order[0].column]});

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
        return `${htmlEncode(name)}`;
    },
    id: (id, _, row) => {
        return `<a class="coll browse" href="view/${encodeURIComponent(id)}" data-path="${htmlEncode(id)}">${htmlEncode(id)}</a>`;
    },
    title: (title, _, row) => {
        return `${htmlEncode(title)}`;
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
     status: (status, _, row) => {
         return `${htmlEncode(convertToHumanReadableStatus(status))}`;
     },
};


function startBrowsing(items)
{
    $('#file-browser').DataTable({
        "bFilter": false,
        "bInfo": false,
        "bLengthChange": true,
        "language": {
            "emptyTable": "No data requests present",
            "lengthMenu": "_MENU_"
        },
        "dom": '<"top">frt<"bottom"lp><"clear">',
        'columns': [{render: tableRenderer.name,   orderable: false, data: 'name'},
                    // Date should be orderable, but limitations
                    // on how queries work prevent us from doing this
                    // correctly without significant overhead.
                    // (enabling this as is may result in duplicated results for data objects)
                    {render: tableRenderer.id,     orderable: false, data: 'id'},
                    {render: tableRenderer.title,  orderable: false, data: 'title'},
                    {render: tableRenderer.date,   data: 'create_time'},
                    {render: tableRenderer.status, orderable: false, data: 'status'}],
        "ajax": getFolderContents,
        "processing": true,
        "serverSide": true,
        "iDeferLoading": 0,
        "pageLength": parseInt(items)
    });

    buildFileBrowser();
}


function convertToHumanReadableStatus(status) {
    switch(status) {
        case "DRAFT":
            return "In draft";
        case "PENDING_ATTACHMENTS":
            return "Pending attachments";
        case "DAO_SUBMITTED":
            return "Submitted (data assessment)";
        case "SUBMITTED":
            return "Submitted";
        case "PRELIMINARY_ACCEPT":
            return "Preliminary accept";
        case "PRELIMINARY_REJECT":
            return "Rejected at preliminary review";
        case "PRELIMINARY_RESUBMIT":
            return "Rejected (resubmit) at preliminary review";
        case "DATAMANAGER_ACCEPT":
            return "Datamanager accept";
        case "DATAMANAGER_REJECT":
            return "Datamanager reject";
        case "DATAMANAGER_RESUBMIT":
            return "Datamanager reject (resubmit)";
        case "UNDER_REVIEW":
            return "Under review";
        case "REJECTED_AFTER_DATAMANAGER_REVIEW":
            return "Rejected after datamanager review";
        case "RESUBMIT_AFTER_DATAMANAGER_REVIEW":
            return "Rejected (resubmit) after datamanager review";
        case "REVIEWED":
            return "Reviewed";
        case "APPROVED":
        case "APPROVED_PRIVATE":
            return "Approved";
        case "REJECTED":
            return "Rejected";
        case "RESUBMIT":
            return "Rejected (resubmit)";
        case "RESUBMITTED":
            return "Resubmitted";
        case "DAO_APPROVED":
            return "Approved (data assessment)";
        case "PREREGISTRATION_SUBMITTED":
            return "Preregistration submitted";
        case "PREREGISTRATION_CONFIRMED":
            return "Preregistration confirmed";
        case "DTA_READY":
            return "DTA ready";
        case "DTA_SIGNED":
            return "DTA signed";
        case "DATA_READY":
            return "Data ready";
        default:
            return "Unknown status";
    }
}


function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html().replaceAll('"', '&quot;');
}
