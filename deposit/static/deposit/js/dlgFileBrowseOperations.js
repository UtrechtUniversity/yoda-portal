/* global browse, path */
'use strict'

let folderSelectBrowser = null
let dlgCurrentFolder = ''
let currentBrowseFolder = ''

$(document).ready(function () {
  dlgCurrentFolder = currentBrowseFolder = path

  // single file/folder moves
  $('body').on('click', 'a.file-copy, a.file-move, a.folder-copy, a.folder-move', function () {
    // Determine action
    if ($(this).hasClass('file-move')) {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'file-move')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Move')
      $('#dlg-file-browse-operations .card-title span.action').text('move')
    } else if ($(this).hasClass('folder-move')) {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'folder-move')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Move')
      $('#dlg-file-browse-operations .card-title span.action').text('move')
    } else if ($(this).hasClass('file-copy')) {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'file-copy')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Copy')
      $('#dlg-file-browse-operations .card-title span.action').text('copy')
    } else {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'folder-copy')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Copy')
      $('#dlg-file-browse-operations .card-title span.action').text('copy')
    }

    // Set filename in modal & button attribute
    $('#dlg-file-browse-operations span.action-file').text($(this).attr('data-name'))
    $('#dlg-file-browse-operations .dlg-action-button').attr('data-name', $(this).attr('data-name'))
    $('#dlg-file-browse-operations .dlg-action-button').attr('data-collection', $(this).attr('data-collection'))

    // Set current folder & initiate browse object.
    dlgCurrentFolder = $(this).attr('data-collection')
    console.info('File/folder move to collection: ' + dlgCurrentFolder)
    dlgSelectAlertHide()
    startBrowsingColl()

    $('#dlg-file-browse-operations').modal('show')
  })

  // Multiple files/folders move
  $('body').on('click', 'a.multiple-copy, a.multiple-move', function () {
    // Determine action
    if ($(this).hasClass('multiple-move')) {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'multiple-move')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Move item(s)')
      $('#dlg-file-browse-operations .card-title span.action').text('move')
      $('#mutli-select-progress').attr('data-action', 'move')
    } else {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'multiple-copy')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Copy item(s)')
      $('#dlg-file-browse-operations .card-title span.action').text('copy')
      $('#mutli-select-progress').attr('data-action', 'copy')
    }

    // Set filename in modal & button attribute
    $('#dlg-file-browse-operations span.action-file').text('selected item(s)')

    // Set current folder & initiate browse object.
    currentBrowseFolder = $('.folder-create').attr('data-path')
    dlgCurrentFolder = currentBrowseFolder
    dlgSelectAlertHide()
    startBrowsingColl()

    $('#dlg-file-browse-operations').modal('show')
  })

  $('body').on('click', 'a.multiple-delete', function () {
    $('#multi-select-delete .collection').text($('.folder-create').attr('data-path'))
    $('#mutli-select-progress').attr('data-action', 'delete')
    $('#multi-select-delete').modal('show')
  })

  // clicking breadcrumbs inside modal
  $('body').on('click', '.browse-select', function (e) {
    dlgBrowse($(this).attr('data-path'))
    e.preventDefault()
  })

  // clicking folder inside modal
  $('body').on('click', '.dlg-browse', function (e) {
    dlgBrowse($(this).attr('data-path'))
    e.preventDefault()
  })

  $('.dlg-action-button').on('click', function () {
    const action = $(this).attr('data-action')
    // Single file
    if (action === 'file-move' || action === 'file-copy' || action === 'folder-move' || action === 'folder-copy') {
      const path = $(this).attr('data-collection') + '/' + $(this).attr('data-name')
      const newPath = dlgCurrentFolder + '/' + $(this).attr('data-name')
      console.info('single - path: ' + path)
      console.info('single - newPath: ' + newPath)

      if (action === 'file-move') {
        moveFile(path, newPath, false)
      } else if (action === 'file-copy') {
        copyFile(path, newPath, false)
      } else if (action === 'folder-move') {
        moveFolder(path, newPath, false)
      } else if (action === 'folder-copy') {
        copyFolder(path, newPath, false)
      }
    } else {
      // Multiple items
      $('.multi-select-table tbody').html('')
      $("input:checkbox[name='multiSelect[]']:checked").each(function (index) {
        const type = $(this).attr('data-type')
        const name = $(this).attr('data-name')
        let icon
        if (type === 'coll') {
          icon = '<i class="fa-regular fa-folder"></i>'
        } else {
          icon = '<i class="fa-regular fa-file"></i>'
        }

        const row = `<tr class="row-${index}">
                    <td>${icon} ${name}</td>
                    <td class="item-progress">-</td>
                </tr>
                `
        $('.multi-select-table tbody').append(row)
      })

      if (action === 'multiple-delete') {
        $('#multi-select-delete').modal('hide')
      } else {
        $('#dlg-file-browse-operations').modal('hide')
      }
      $('#mutli-select-progress').modal('show')
    }
  })

  $('#mutli-select-progress').on('show.bs.modal', function (e) {
    // Get action (move or copy)
    const action = $('#mutli-select-progress').attr('data-action')

    $("input:checkbox[name='multiSelect[]']:checked").each(function (index) {
      const type = $(this).attr('data-type')
      const name = $(this).attr('data-name')
      const currentPath = $(this).val()
      let collection
      let newPath
      if (action === 'delete') {
        collection = $('.folder-create').attr('data-path')
      } else {
        newPath = dlgCurrentFolder + '/' + name
      }

      if (type === 'data') {
        if (action === 'copy') {
          copyFile(currentPath, newPath, true, index)
        } else if (action === 'move') {
          moveFile(currentPath, newPath, true, index)
        } else if (action === 'delete') {
          deleteFile(collection, name, index)
        }
      } else {
        if (action === 'copy') {
          copyFolder(currentPath, newPath, true, index)
        } else if (action === 'move') {
          moveFolder(currentPath, newPath, true, index)
        } else if (action === 'delete') {
          deleteFolder(collection, name, index)
        }
      }
    })
  })

  $('#finishMultiSelect').on('click', function () {
    $("input:checkbox[id='multi-select-all']").prop('checked', false)
  })
})

async function copyFile (filepath, newFilepath, multiple, multipleIndex = null) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Copying <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }

  try {
    const result = await Yoda.call('research_file_copy',
      {
        filepath: Yoda.basePath + filepath,
        new_filepath: Yoda.basePath + newFilepath
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Copy completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The file has been successfully copied.')
        $('#dlg-file-browse-operations').modal('hide')
      }
    } else { // non api error
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
      } else {
        dlgSelectAlertShow(result.status_info)
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
  $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Copy</span>')
}

async function moveFile (filepath, newFilepath, multiple, multipleIndex = null) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Moving <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }

  try {
    const result = await Yoda.call('research_file_move',
      {
        filepath: Yoda.basePath + filepath,
        new_filepath: Yoda.basePath + newFilepath
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Move completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The file has been successfully moved.')
        $('#dlg-file-browse-operations').modal('hide')
        const collection = $('#dlg-file-browse-operations .dlg-action-button').attr('data-collection')
        browse(collection, true)
      }
    } else { // non api error
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
      } else {
        dlgSelectAlertShow(result.status_info)
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
  $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Move</span>')
}

async function copyFolder (folderPath, newFolderpath, multiple, multipleIndex = null) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Copying <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }

  try {
    const result = await Yoda.call('research_folder_copy',
      {
        folder_path: Yoda.basePath + folderPath,
        new_folder_path: Yoda.basePath + newFolderpath
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Copy completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The folder has been successfully copied.')
        $('#dlg-file-browse-operations').modal('hide')
      }
    } else { // non api error
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
      } else {
        dlgSelectAlertShow(result.status_info)
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
  $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Copy</span>')
}

async function moveFolder (folderPath, newFolderpath, multiple, multipleIndex = null) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Moving <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }

  try {
    const result = await Yoda.call('research_folder_move',
      {
        folder_path: Yoda.basePath + folderPath,
        new_folder_path: Yoda.basePath + newFolderpath
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Move completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The folder has been successfully moved.')
        $('#dlg-file-browse-operations').modal('hide')
        const collection = $('#dlg-file-browse-operations .dlg-action-button').attr('data-collection')
        browse(collection, true)
      }
    } else { // non api error
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
      } else {
        dlgSelectAlertShow(result.status_info)
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
  $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Move</span>')
}
async function deleteFolder (collection, folderName, multipleIndex = null) {
  $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')

  try {
    const result = await Yoda.call('research_folder_delete',
      {
        coll: Yoda.basePath + collection,
        folder_name: folderName
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Delete completed')
      browse(collection, true)
    } else { // non api error
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
    }
  } catch (e) { // API ERROR
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
  }
}

async function deleteFile (collection, fileName, multipleIndex = null) {
  $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')

  try {
    const result = await Yoda.call('research_file_delete',
      {
        coll: Yoda.basePath + collection,
        file_name: fileName
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Delete completed')
      browse(collection, true)
    } else { // non api error
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
    }
  } catch (e) { // API ERROR
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
  }
}

function startBrowsingColl () {
  if (!folderSelectBrowser) {
    folderSelectBrowser = $('#folder-select-browser').DataTable({
      bFilter: false,
      bInfo: false,
      bLengthChange: false,
      language: {
        emptyTable: 'No accessible files/folders present',
        lengthMenu: '_MENU_'
      },
      dom: '<"top">frt<"bottom"lp><"clear">',
      columns: [
        { render: tableRendererColl.name, data: 'name' },
        // Size and date best not be orderable, may result in duplicated results for data objects.
        // {render: tableRendererColl.size, orderable: false, data: 'size'},
        { render: tableRendererColl.date, orderable: false, data: 'modify_time' }
        // {render: tableRendererColl.context, orderable: false },
      ],
      ajax: getFolderContents2,
      processing: true,
      serverSide: true,
      iDeferLoading: 0,
      pageLength: parseInt(Yoda.storage.session.get('pageLength') === null ? Yoda.settings.number_of_items : Yoda.storage.session.get('pageLength'))
    })
    $('#folder-select-browser').on('length.dt', function (e, settings, len) {
      Yoda.storage.session.set('pageLength', len)
    })
  }
  dlgBrowse(dlgCurrentFolder)
}

// Fetches directory contents to populate the listing table.
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

      const result = await Yoda.call('browse_folder',
        {
          coll: Yoda.basePath + dlgCurrentFolder,
          offset: args.start,
          limit: batchSize,
          sort_order: args.order[0].dir,
          sort_on: ['name', 'modified'][args.order[0].column],
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

      // hide the pagination if needed
      if (total < 10) { $('.bottom').hide() }

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

const tableRendererColl = {
  name: (name, _, row) => {
    const tgt = `${dlgCurrentFolder}/${name}`
    if (row.type === 'coll') { return `<a class="coll dlg-browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${Yoda.htmlEncode(tgt)}"><i class="fa-regular fa-folder"></i> ${Yoda.htmlEncode(name)}</a>` } else { return `<i class="fa-regular fa-file"></i> ${Yoda.htmlEncode(name)}` }
  },
  //    size: (size, _, row) => {
  //        if (row.type === 'coll') {
  //            return '';
  //        } else {
  //            let szs = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
  //            let szi = 0;
  //            while (size >= 1024 && szi < szs.length-1) {
  //                size /= 1024;
  //                szi++;
  //            }
  //            return (Math.floor(size*10)/10+'') + '&nbsp;' + szs[szi];
  //        }
  //    },
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
    return ''
  }
}

function dlgBrowse (dir) {
  // Only decode if the directory has 'deposit-' prefix
  if ((dir.substring(dir.lastIndexOf('/') + 1)).includes('deposit-')) {
    dir = decodeURIComponent(dir)
  }

  dlgCurrentFolder = dir

  dlgSelectAlertHide()

  dlgMakeBreadcrumb(dir)

  dlgBuildFileBrowser(dir)
}

function dlgBuildFileBrowser (dir) {
  // let fileBrowser = $('#file-browser').DataTable();
  getFolderContents2.dropCache()
  folderSelectBrowser.ajax.reload()
}

function dlgMakeBreadcrumb (urlEncodedDir) {
  const dir = urlEncodedDir

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

  let html = '<li class="active">Deposit</li>'
  if (totalParts > 0 && parts[0] !== 'undefined') {
    html = '<li class="browse-select breadcrumb-item" data-path="">Deposit</li>'
    let path = ''
    $.each(parts, function (k, part) {
      path += '/' + encodeURIComponent(part)

      // Active item
      const valueString = Yoda.htmlEncode(part).replace(/ /g, '&nbsp;')
      if (k === (totalParts - 1)) {
        html += '<li class="active breadcrumb-item">' + valueString + '</li>'
      } else {
        html += '<li class="browse-select breadcrumb-item" data-path="' + path + '">' + valueString + '</li>'
      }
    })
  }

  $('ol.dlg-breadcrumb').html(html)
}

/// alert handling
function dlgSelectAlertShow (errorMessage) {
  $('#dlg-select-alert-panel').removeClass('hide')
  $('#dlg-select-alert-panel span').html(errorMessage)
}

function dlgSelectAlertHide () {
  $('#dlg-select-alert-panel').addClass('hide')
}
