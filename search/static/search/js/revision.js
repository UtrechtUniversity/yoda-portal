'use strict'

// Handles content of two tables
// 1) Revision overview table
// 2) Folder selection for a revision to be placed

// Handles actual restoring of a selected file.

let revisionTargetColl = ''
let folderSelectBrowser = null
let dlgCurrentFolder = ''
let currentSearchArg = ''

$(document).ready(function () {
  // Click on file browser -> open revision details
  startBrowsing()

  $('#file-browser tbody').on('click', 'tr', function () {
    clickFileForRevisionDetails($(this))
  })

  $('.search-btn').on('click', function () {
    browseRevisions()
  })

  $('#search-filter').bind('keypress', function (e) {
    if (e.keyCode === 13) {
      browseRevisions()
    }
  })
})

/// MAIN TABLE containing revisioned files
function startBrowsing () {
  $('#file-browser').DataTable({
    bFilter: false,
    bInfo: false,
    bLengthChange: true,
    language: {
      emptyTable: 'No accessible files/folders present',
      lengthMenu: '_MENU_'
    },
    dom: '<"top">frt<"bottom"lp><"clear">',
    columns: [{ render: tableRenderer.name, orderable: false, data: 'main_original_dataname' },
      { render: tableRenderer.count, orderable: false, data: 'revision_count' }
    ],
    ajax: getRevisionListContents,
    processing: true,
    serverSide: true,
    iDeferLoading: 0,
    ordering: false,
    pageLength: parseInt(Yoda.settings.number_of_items)
  })
  browseRevisions()
}

function browseRevisions () {
  currentSearchArg = $('#search-filter').val()

  const fileBrowser = $('#file-browser').DataTable()
  fileBrowser.ajax.reload()
}

// Fetches directory contents to populate the listing table.
const getRevisionListContents = (() => {
  // Close over some state variables.
  // -> we keep a multi-page cache handy, since getting only $page_length [=10]
  //    results each time is wasteful and slow.
  // A change in sort column/order or folder will invalidate the cache.

  // The amount of rows to request at once.
  // *Must* be equal to or greater than the largest datatables page length,
  // and *should* be smaller than iRODS SQL rows per batch.
  const batchSize = 200
  // (~140 B per entry in JSON returned by iRODS,
  //  so depending on name = up to 28K to transfer for each fetch)

  let total = false // Total subcollections / data objects.
  let cache = [] // Cached result rows (may be more than shown on one page).
  let cacheStart = null // Row number of the first cache entry.
  let cacheSearchArg = null // Folder path of the cache.
  // let cacheSortCol   = null;  // Cached sort column nr.
  // let cacheSortOrder = null;  // Cached sort order.
  let i = 0 // Keep simultaneous requests from interfering.

  const get = async (args) => {
    // Check if we can use the cache.
    if (cache.length &&
            currentSearchArg === cacheSearchArg && /// DIT MOET SEARCH ARGUMENT WORDEN!!!
            // && args.order[0].dir    === cacheSortOrder
            // && args.order[0].column === cacheSortCol
            args.start >= cacheStart &&
            args.start + args.length <= cacheStart + batchSize) {
      return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length)
    } else {
      // Nope, load new data via the API.
      const j = ++i

      const result = await Yoda.call('revisions_search_on_filename',
        {
          searchString: currentSearchArg, /// TOEVOEGEN SEARCH ARGUMENT
          offset: args.start,
          limit: batchSize
        })

      // If another requests has come while we were waiting, simply drop this one.
      if (i !== j) return null

      // Update cache info.
      total = result.total
      cacheStart = args.start
      cache = result.items
      cacheSearchArg = currentSearchArg
      // cacheSortCol   = args.order[0].column;
      // cacheSortOrder = args.order[0].dir;

      return cache.slice(args.start - cacheStart, args.length)
    }
  }

  // The actual function passed to datatables.
  // (needs a non-async wrapper cause datatables won't accept it otherwise)
  const fn = (args, cb, settings) => (async () => {
    const data = await get(args)
    if (data === null) { return }

    const callback = {
      data,
      recordsTotal: total,
      recordsFiltered: total
    }
    cb(callback)
  })()

  // Allow manually clearing results (needed during soft-reload after uploading a file).
  fn.dropCache = () => { cache = [] }
  return fn
})()

const tableRenderer = {
  name: (name, _, row) => {
    // let tgt = `${dlgCurrentFolder}/${name}`;
    // return row.revision_count;
    return `<a data-path="${encodeURIComponent(row.original_coll_name)}" data-collection-exists="${row.collection_exists}" >/${Yoda.htmlEncode(row.original_coll_name)}</a>`
  },
  count: (count, _, row) => {
    return Yoda.htmlEncode(count)
  }
}

/// ////////////////////////////////////////////////////////////////////////////////////
// Main - revision table dropdown window hodling revision details
async function clickFileForRevisionDetails (obj) {
  const tr = obj.closest('tr')

  const collectionExists = $('td:eq(0) a', tr).attr('data-collection-exists')
  const path = decodeURIComponent($('td:eq(0) a', tr).attr('data-path'))
  const row = $('#file-browser').DataTable().row(tr)

  if (row.child.isShown()) {
    // This row is already open - close it
    row.child.hide()
    tr.removeClass('shown')
    return
  }

  const result = await Yoda.call('revisions_list', { path: Yoda.basePath + '/' + path })

  let htmlDetailView = '<div class="col-md-12"><div class="row">'

  if (collectionExists === 'false') {
    htmlDetailView += '<i class="fa-solid fa-exclamation-circle"></i> This collection no longer exists.'
  }

  htmlDetailView += '<table id="" class="table" ><thead><tr><th>Revision date</th><th>Owner</th><th>Size</th><th></th></tr></thead>'
  htmlDetailView += '<tbody>'

  for (let i = 0; i < result.revisions.length; i++) {
    htmlDetailView += '<tr>'
    htmlDetailView += '<td>' + result.revisions[i].org_original_modify_time + '</td>'
    htmlDetailView += '<td>' + result.revisions[i].org_original_data_owner_name + '</td>'
    htmlDetailView += '<td>' + humanFilesize(result.revisions[i].org_original_filesize) + '</td>'

    htmlDetailView += '<td><div class="btn-group" role="group" aria-label="...">'
    // list of available revisions for given file. button for restoring purposes
    htmlDetailView += '<button type="button" class="btn btn-primary btn-revision-select-dialog" ' +
            // 'data-toggle="modal" data-target="#select-folder" ' +
            'data-orgfilename="' + rawurlencode(result.revisions[i].org_original_data_name) + '" ' +
            'data-objectid="' + result.revisions[i].data_id + '"' +
            'data-path="' + rawurlencode(result.revisions[i].dezoned_coll_name) + '"><i class="fa-solid fa-magic" aria-hidden="true"></i> Restore</button>'
    htmlDetailView += '</div></td>'
    htmlDetailView += '</tr>'
  }
  htmlDetailView += '</tbody>'
  htmlDetailView += '</table>'

  htmlDetailView += '</div></div>'

  row.child(htmlDetailView).show()

  // Button handling restore button: After opening sub windown give possibility to select folder for placement of selected revision
  $('.btn-revision-select-dialog').on('click', function () {
    const id = $(this).data('objectid')
    let path = decodeURIComponent($(this).data('path'))
    const orgFileName = decodeURIComponent($(this).data('orgfilename'))

    // When the collection no longer exists, fall back to the root
    if (collectionExists === 'false') { path = '/' + path.split('/')[1] }
    showFolderSelectDialog(id, path, orgFileName)
    // event.stopPropagation();
  })
}

/// ///////////////////////////////////////////// SELECT FOLDER FOR SPECIFIC REVISION
// functions for handling of folder selection - easy point of entry for select-folder functionality from the panels within dataTables
// objectid is the Id of the revision that has to be restored
function showFolderSelectDialog (restorationObjectId, path, orgFileName) {
  // Save the variables so can be reused later if restoring is cancelled and reinitiated
  $('#restoration-objectid').val(restorationObjectId)
  $('#org_folder_select_path').val(path)
  $('#org_folder_select_filename').val(orgFileName)

  startBrowsing2(path)

  $('.mode-dlg-locked').addClass('hide')
  $('.mode-dlg-exists').addClass('hide')

  $('.alert-panel-overwrite').addClass('hide')
  $('.cover').addClass('hide')
  $('.revision-restore-dialog').removeClass('hide')

  // dialog initialisation
  $('#select-folder .modal-title').html('Select a location for you revision to be restored')
  $('#btn-restore').prop('disabled', false)
  $('#select-folder .cover-browse-elements').removeClass('hide')

  $('#select-folder').modal('show')
}

function startBrowsing2 (path) {
  if (!folderSelectBrowser) {
    folderSelectBrowser = $('#folder-browser').DataTable({
      bFilter: false,
      bInfo: false,
      bLengthChange: true,
      language: {
        emptyTable: 'No accessible files/folders present',
        lengthMenu: '_MENU_'
      },
      dom: '<"top">frt<"bottom"lp><"clear">',
      columns: [{ render: tableRenderer2.name, data: 'name' },
        // Size and date should be orderable, but limitations
        // on how queries work prevent us from doing this
        // correctly without significant overhead.
        // (enabling this as is may result in duplicated results for data objects)
        // {render: tableRenderer.size,    orderable: false, data: 'size'},
        { render: tableRenderer2.date, orderable: false, data: 'modify_time' }],
      // {render: tableRenderer.context, orderable: false }],
      ajax: getFolderContents2,
      processing: true,
      serverSide: true,
      iDeferLoading: 0,
      pageLength: parseInt(Yoda.settings.number_of_items)
    })
  }
  dlgCurrentFolder = path
  browse(dlgCurrentFolder)
}

// Fetches directory contents to populate the listing table.
// Only look into research area!
const getFolderContents2 = (() => {
  // Close over some state variables.
  // -> we keep a multi-page cache handy, since getting only $page_length [=10]
  //    results each time is wasteful and slow.
  // A change in sort column/order or folder will invalidate the cache.

  // The amount of rows to request at once.
  // *Must* be equal to or greater than the largest datatables page length,
  // and *should* be smaller than iRODS SQL rows per batch.
  const batchSize = 200
  // (~140 B per entry in JSON returned by iRODS,
  //  so depending on name = up to 28K to transfer for each fetch)

  let total = false // Total subcollections / data objects.
  let cache = [] // Cached result rows (may be more than shown on one page).
  let cacheStart = null // Row number of the first cache entry.
  let cacheFolder = null // Folder path of the cache.
  let cacheSortCol = null // Cached sort column nr.
  let cacheSortOrder = null // Cached sort order.
  let i = 0 // Keep simultaneous requests from interfering.

  const get = async (args) => {
    // Check if we can use the cache.
    if (cache.length &&
            dlgCurrentFolder === cacheFolder &&
            args.order[0].dir === cacheSortOrder &&
            args.order[0].column === cacheSortCol &&
            args.start >= cacheStart &&
            args.start + args.length <= cacheStart + batchSize) {
      return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length)
    } else {
      // Nope, load new data via the API.
      const j = ++i
      // + currentFolder
      const result = await Yoda.call('browse_collections',
        {
          coll: Yoda.basePath + dlgCurrentFolder, //
          offset: args.start,
          limit: batchSize,
          sort_order: args.order[0].dir,
          sort_on: ['name', 'size', 'modified'][args.order[0].column],
          space: 'Space.RESEARCH'
        })

      // If another requests has come while we were waiting, simply drop this one.
      if (i !== j) return null

      // Populate the 'size' of collections so datatables doesn't get confused.
      for (const x of result.items) {
        if (x.type === 'coll') { x.size = 0 }
      }

      // Update cache info.
      total = result.total
      cacheStart = args.start
      cache = result.items
      cacheFolder = dlgCurrentFolder
      cacheSortCol = args.order[0].column
      cacheSortOrder = args.order[0].dir

      return cache.slice(args.start - cacheStart, args.length)
    }
  }

  // The actual function passed to datatables.
  // (needs a non-async wrapper cause datatables won't accept it otherwise)
  const fn = (args, cb, settings) => (async () => {
    const data = await get(args)
    if (data === null) { return }

    const callback = {
      data,
      recordsTotal: total,
      recordsFiltered: total
    }
    cb(callback)
  })()

  // Allow manually clearing results (needed during soft-reload after uploading a file).
  fn.dropCache = () => { cache = [] }
  return fn
})()

const tableRenderer2 = {
  name: (name, _, row) => {
    const tgt = `${dlgCurrentFolder}/${name}`
    if (row.type === 'coll') { return `<a class="coll dlg-browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${Yoda.htmlEncode(tgt)}"><i class="fa-regular fa-folder"></i> ${Yoda.htmlEncode(name)}</a>` } else { return `<i class="fa-regular fa-file"></i> ${Yoda.htmlEncode(name)}` }
  },
  size: (size, _, row) => {
    if (row.type === 'coll') {
      return ''
    } else {
      const szs = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']
      let szi = 0
      while (size >= 1024 && szi < szs.length - 1) {
        size /= 1024
        szi++
      }
      return (Math.floor(size * 10) / 10 + '') + '&nbsp;' + szs[szi]
    }
  },
  date: ts => {
    const date = new Date(ts * 1000)
    const pad = n => n < 10 ? '0' + n : '' + n
    const elem = $('<span>')
    elem.text(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
                ` ${pad(date.getHours())}:${pad(date.getMinutes())}`)
    elem.attr('title', date.toString()) // (should include seconds and TZ info)
    return elem[0].outerHTML
  },
  context: (_, __, row) => {
    if (row.type === 'coll') { return '' }
  }
}

/// / handling DIALOG SELECT FOLDER
// dlg-select-folder
$(document).ready(function () {
  // dlg-select-folder => Button to actually restore the file
  $('#btn-restore').on('click', function () {
    // Present the dialog if duplicates and fill the initial values
    $('#newFileName').val($('#org_folder_select_filename').val()) // Is in dialog where to enter a new name when duplicate

    // For error reporting
    $('.mode-dlg-exists .alert-warning').html('The file name <b>' + $('#org_folder_select_filename').val() + '</b> (location: ' + $('#org_folder_select_path').val() + ') already exists')

    restoreRevision('restore_no_overwrite')
  })

  // dlg-select-folder
  $('#btn-restore-overwrite').on('click', function (event) {
    event.preventDefault()
    restoreRevision('restore_overwrite')
  })

  // dlg-select-folder
  $('#btn-restore-next-to').on('click', function (event) {
    event.preventDefault()
    restoreRevision('restore_next_to')
  })

  // dlg-select-folder
  $('#btn-select-other-folder').on('click', function () {
    $('.cover').addClass('hide')
    $('.revision-restore-dialog').removeClass('hide')
  })

  // dlg-select-folder
  $('#btn-cancel-overwrite-dialog').on('click', function () {
    $('.cover').addClass('hide')
    $('.revision-restore-dialog').removeClass('hide')
    $('#select-folder .cover-browse-elements').removeClass('hide')
  })

  $('body').on('click', '.dlg-browse', function (e) {
    browse($(this).attr('data-path'))

    // Dismiss stale messages.
    // $('#messages .close').click();
    e.preventDefault()
  })
})

// select-folder
function dlgAlertShow (alertMessage) {
  $('.alert-folder-select').html(alertMessage)
}

// dlg-select-folder
function browse (dir) {
  dlgCurrentFolder = dir
  // Hide previous alerts
  dlgAlertShow('')

  makeBreadcrumb(dir)

  changeBrowserUrl(dir)

  buildFileBrowser(dir)
}

// select-folder
function changeBrowserUrl (path) {
  // alertPanelsHide();
  revisionTargetColl = path
}

// select-folder
function buildFileBrowser (dir) {
  const folderBrowser = $('#folder-browser').DataTable()
  folderBrowser.ajax.reload()

  return true
}

// select-folder
function makeBreadcrumb (urlEncodedDir) {
  const dir = decodeURIComponent((urlEncodedDir + '').replace(/\+/g, '%20'))

  let parts = []
  if (typeof dir !== 'undefined') {
    if (dir.length > 0) {
      const elements = dir.split('/')

      // Remove empty elements
      parts = $.map(elements, function (v) {
        return v === '' ? null : v
      })
    }
  }

  // Build html
  const totalParts = parts.length
  let html = ''
  if (totalParts > 0 && parts[0] !== 'undefined') {
    html = '<li class="breadcrumb-item browse dlg-browse" data-path="" style="cursor:pointer;">Home</li>'
    let path = ''
    $.each(parts, function (k, part) {
      path += '/' + encodeURIComponent(part)

      // Active item
      const valueString = Yoda.htmlEncode(part).replace(/ /g, '&nbsp;')
      if (k === (totalParts - 1)) {
        html += '<li class="breadcrumb-item active">' + valueString + '</li>'
      } else {
        html += '<li class="breadcrumb-item browse dlg-browse" data-path="' + path + '" style="cursor:pointer;">' + valueString + '</li>'
      }
    })
  } else {
    html = '<li class="breadcrumb-item active">Home</li>'
  }

  $('ol.dlg-breadcrumb').html(html)
}

// handle RESTORING a revision
async function restoreRevision (overwriteFlag) {
  dlgAlreadyExistsAlert('')

  const restorationObjectId = $('#restoration-objectid').val()
  const newFileName = $('#newFileName').val()

  if (typeof revisionTargetColl === 'undefined' || revisionTargetColl.length === 0) {
    const errorMessage = 'The HOME folder cannot be used for restoration purposes. Please choose another folder'
    dlgAlertShow(errorMessage)
    return
  }

  if (overwriteFlag === 'restore_next_to') {
    if (newFileName.length === 0) {
      dlgAlreadyExistsAlert('Please enter a name for the file you want to restore')
      return
    }
    if (!(newFileName.indexOf('/') === -1 && newFileName.indexOf('\\') === -1)) {
      dlgAlreadyExistsAlert('It is not allowed to use "/" or "\\" in a filename.')
      return
    }
  }

  const result = await Yoda.call('revisions_restore',
    {
      revision_id: restorationObjectId,
      overwrite: overwriteFlag,
      coll_target: Yoda.basePath + revisionTargetColl,
      new_filename: newFileName
    },
    { quiet: true, rawResult: true }
  )

  // In restore-next-to mode different things can go wrong.
  // 1) Another  duplicate name can be entered
  // 2) An illegal filename containing / or \
  // Case 2 is dealt with in the backend but does not require to be treated here. The above javascript already protects for this
  if (result.status === 'error_duplicate_file') { // hier differentieren naar verschillende types response-process-statussen
    if (overwriteFlag === 'restore_next_to') {
      // Error reporting within overwrite/new name dialog box
      dlgAlreadyExistsAlert('The new file name <b>' + newFileName + '</b> (location: ' + revisionTargetColl + ') already exists')
      return
    }

    // bring up Overwrite/new name dialog
    $('.cover').removeClass('hide')
    $('.mode-dlg-exists').removeClass('hide')
    $('#form-restore-overwrite').removeClass('hide')
    $('#select-folder .cover-browse-elements').addClass('hide')
  } else if (result.status === 'ok') {
    $('#select-folder .modal-title').html('Successfully restored file')
    $('#btn-restore').prop('disabled', true)
    $('#select-folder .cover-browse-elements').addClass('hide')

    let html = 'Successfully restored your revision in: ' + dlgCurrentFolder
    html += '<br>Please follow <a href="/research/?dir=' + dlgCurrentFolder + '">this link to go to research area</a>!'

    dlgAlertShow(html)
    $('.cover').addClass('hide')
    $('.revision-restore-dialog').removeClass('hide')
  } else { // non api error - simply present the error in the main-revision-restore dialog
    dlgAlertShow(result.status_info)
    $('.cover').addClass('hide')
    $('.revision-restore-dialog').removeClass('hide')
  }
}

// Alerts to user in dialog when file already exists
function dlgAlreadyExistsAlert (message) {
  $('.alert-dlg-already-exists').html(message)
}

/// ////////////////////////////////////////////////////////////////////////////////////////////////////////
// util functions

function rawurlencode (str) {
  //       discuss at: https://locutus.io/php/rawurlencode/
  //      original by: Brett Zamir (https://brett-zamir.me)
  //         input by: travc
  //         input by: Brett Zamir (https://brett-zamir.me)
  //         input by: Michael Grier
  //         input by: Ratheous
  //      bugfixed by: Kevin van Zonneveld (https://kvz.io)
  //      bugfixed by: Brett Zamir (https://brett-zamir.me)
  //      bugfixed by: Joris
  // reimplemented by: Brett Zamir (https://brett-zamir.me)
  // reimplemented by: Brett Zamir (https://brett-zamir.me)
  //           note 1: This reflects PHP 5.3/6.0+ behavior
  //           note 1: Please be aware that this function expects \
  //           note 1: to encode into UTF-8 encoded strings, as found on
  //           note 1: pages served as UTF-8
  //        example 1: rawurlencode('Kevin van Zonneveld!')
  //        returns 1: 'Kevin%20van%20Zonneveld%21'
  //        example 2: rawurlencode('https://kvz.io/')
  //        returns 2: 'https%3A%2F%2Fkvz.io%2F'
  //        example 3: rawurlencode('https://www.google.nl/search?q=Locutus&ie=utf-8')
  //        returns 3: 'https%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3DLocutus%26ie%3Dutf-8'

  str = (str + '')

  // Tilde should be allowed unescaped in future versions of PHP (as reflected below),
  // but if you want to reflect current
  // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
}

function humanFilesize (size) {
  const szs = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']
  let szi = 0
  while (size >= 1024 && szi < szs.length - 1) {
    size /= 1024
    szi++
  }
  return (Math.floor(size * 10) / 10 + '') + '&nbsp;' + szs[szi]
}
