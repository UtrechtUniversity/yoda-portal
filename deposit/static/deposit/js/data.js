/* global Flow */
'use strict'

$(document).ajaxSend(function (e, request, settings) {
  // Append a CSRF token to all AJAX POST requests.
  if (settings.type === 'POST' && settings.data.length) {
    settings.data +=
             '&' + encodeURIComponent(Yoda.csrf.tokenName) +
              '=' + encodeURIComponent(Yoda.csrf.tokenValue)
  }
})

let currentFolder

$(function () {
  currentFolder = dir

  // Canonicalize path somewhat, for convenience.
  currentFolder = currentFolder.replace(/\/+/g, '/').replace(/\/$/, '')

  if ($('#file-browser').length) {
    startBrowsing()
  }

  /// /////////////////////////////////////////////
  // File and folder management from context menu
  /// /////////////////////////////////////////////
  $('.btn-group button.folder-create').on('click', function () {
    // Destroy earlier alerts
    fileMgmtDialogAlert('folder-create', '')

    // Set initial values
    $('#path-folder-create').val('')
    $('#folder-create #collection').html($(this).attr('data-path')) // for user
    $('.btn-confirm-folder-create').attr('data-path', $(this).attr('data-path'))

    $('#folder-create').modal('show')
  })

  // FOLDER create
  $('.btn-confirm-folder-create').on('click', function () {
    // er kan een dubbele naam zijn? error handling afwikkelen!
    handleFolderAdd($('#path-folder-create').val(), $(this).attr('data-path'))
  })

  // FOLDER rename
  $('body').on('click', 'a.folder-rename', function () {
    fileMgmtDialogAlert('folder-rename', '')

    // set initial values for further processing and user experience
    $('#folder-rename-name').val($(this).attr('data-name'))
    $('#org-folder-rename-name').val($(this).attr('data-name'))
    $('#folder-rename #collection').html($(this).attr('data-collection'))
    $('.btn-confirm-folder-rename').attr('data-collection', $(this).attr('data-collection'))

    $('#folder-rename').modal('show')
  })
  $('.btn-confirm-folder-rename').on('click', function () {
    handleFolderRename($('#folder-rename-name').val(), $(this).attr('data-collection'), $('#org-folder-rename-name').val())
  })

  // FOLDER delete
  $('body').on('click', 'a.folder-delete', function () {
    fileMgmtDialogAlert('folder-delete', '')

    // set initial values for further processing and user experience
    $('#folder-delete #collection').html($(this).attr('data-collection'))
    $('#folder-delete-name').html($(this).attr('data-name'))
    $('.btn-confirm-folder-delete').attr('data-collection', $(this).attr('data-collection'))
    $('.btn-confirm-folder-delete').attr('data-name', $(this).attr('data-name'))

    $('#folder-delete').modal('show')
  })

  $('.btn-confirm-folder-delete').on('click', function () {
    handleFolderDelete($(this).attr('data-collection'), $(this).attr('data-name'))
  })

  // FILE rename
  $('body').on('click', 'a.file-rename', function () {
    // Destroy earlier alerts
    fileMgmtDialogAlert('file-rename', '')

    // set initial values for further processing and user experience
    $('#file-rename-name').val($(this).attr('data-name'))
    $('#org-file-rename-name').val($(this).attr('data-name'))
    $('#file-rename #collection').html($(this).attr('data-collection'))
    $('.btn-confirm-file-rename').attr('data-collection', $(this).attr('data-collection'))

    $('#file-rename').modal('show')
    // input text selection handling - select all text in front of last '.'
    $('#file-rename-name').focus()
    let endSelection = $(this).attr('data-name').lastIndexOf('.')
    if (endSelection === -1) {
      endSelection = $(this).attr('data-name').length
    }
    document.getElementById('file-rename-name').setSelectionRange(0, endSelection)
  })

  $('.btn-confirm-file-rename').on('click', function () {
    handleFileRename($('#file-rename-name').val(), $(this).attr('data-collection'), $('#org-file-rename-name').val())
  })

  // FILE delete
  $('body').on('click', 'a.file-delete', function () {
    // Destroy earlier alerts
    fileMgmtDialogAlert('file-delete', '')

    // set initial values for further processing and user experience
    $('#file-delete #collection').html($(this).attr('data-collection'))
    $('#file-delete-name').html($(this).attr('data-name'))
    $('.btn-confirm-file-delete').attr('data-collection', $(this).attr('data-collection'))
    $('.btn-confirm-file-delete').attr('data-name', $(this).attr('data-name'))

    $('#file-delete').modal('show')
  })

  $('.btn-confirm-file-delete').on('click', function () {
    handleFileDelete($(this).attr('data-collection'), $(this).attr('data-name'))
  })

  // Show checksum report
  $('body').on('click', 'a.action-show-checksum-report', function () {
    const folder = $(this).attr('data-folder')
    const downloadUrl = 'browse/download_checksum_report?path=' + encodeURIComponent(folder)

    $('#showChecksumReport .collection').text(folder)
    $('#showChecksumReport .modal-body #checksumReport').html('')
    $('#showChecksumReport .modal-footer .download-report-text').attr('href', downloadUrl + '&format=text')
    $('#showChecksumReport .modal-footer .download-report-csv').attr('href', downloadUrl + '&format=csv')

    Yoda.call('research_manifest',
      { coll: Yoda.basePath + folder }).then((data) => {
      let table = '<table class="table table-striped"><tbody>'

      table += '<thead><tr><th>Filename</th><th>Checksum</th></thead>'
      $.each(data, function (index, obj) {
        table += `<tr>
                     <td>${obj.name}</td>
                     <td>${obj.checksum}</td>
                </tr>`
      })
      table += '</tbody></table>'

      $('#showChecksumReport .modal-body #checksumReport').html(table)
      $('#showChecksumReport').modal('show')
    })
  })

  // Handle action menu
  const actions = []
  actions['show-checksum-report'] = 'Show checksum report'
  handleActionsList(actions, dir)

  // Flow.js upload handler
  const r = new Flow({
    target: '/research/upload',
    chunkSize: 25 * 1024 * 1024,
    forceChunkSize: true,
    simultaneousUploads: 1,
    query: { csrf_token: Yoda.csrf.tokenValue, filepath: '' }
  })
  // Flow.js isn't supported, fall back on a different method
  if (!r.support) {
    Yoda.set_message('error', 'No upload browser support.')
  }

  // Assign upload places for dropping/selecting files
  r.assignDrop($('.upload-drop')[0])
  r.assignBrowse($('.upload-file')[0])
  r.assignBrowse($('.upload-folder')[0], true)

  // When chosing to close overview of upload overview then all incomplete file uploads will be canceled.
  $('.btn-close-uploads-overview').on('click', function () {
    r.cancel()
    $('#files').html('')
    $('#uploads').addClass('hidden')
    // clear information present for next time dialog is presented
    $('.uploads-progress-information').html('')
    $('.uploads-total-progress-bar').css('width', '0%')
    $('.uploads-total-progress-bar-perc').html('0%')
  })

  // Flow.js handle events
  r.on('filesAdded', function (files) {
    if (files.length) {
      $('#files').html('')
      // clear information present for new totals
      $('.uploads-progress-information').html('')
      $('.uploads-total-progress-bar').css('width', '0%')
      $('.uploads-total-progress-bar-perc').html('0%')

      $.each(files, function (key, file) {
        logUpload(file.uniqueIdentifier, file)

        const $self = $('#' + file.uniqueIdentifier)
        // Pause btn
        $self.find('.upload-pause').on('click', function () {
          file.pause()
          $self.find('.upload-pause').hide()
          $self.find('.upload-resume').show()
          $self.find('.msg').text('Upload paused')
        })
        // Resume btn
        $self.find('.upload-resume').on('click', function () {
          file.resume()
          $self.find('.upload-pause').show()
          $self.find('.upload-resume').hide()
          $self.find('.msg').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
        })
        // Cancel btn
        $self.find('.upload-cancel').on('click', function () {
          file.cancel()
          $self.remove()
        })
        // Retry btn
        $self.find('.upload-retry').on('click', function () {
          file.retry()
          $self.find('.upload-pause').show()
          $self.find('.upload-retry').hide()
          $self.find('.msg').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
        })
      })
    }
    $('#uploads').removeClass('hidden')
  })
  r.on('filesSubmitted', function () {
    const path = $('.upload').attr('data-path')
    r.opts.query.filepath = path
    r.upload()
  })
  r.on('complete', function () {
    const path = $('.upload').attr('data-path')
    browse(path)
  })
  r.on('fileSuccess', function (file, message) {
    $('#' + file.uniqueIdentifier + ' .msg').html("<span class='text-success'>Upload complete</span>")
    const $self = $('#' + file.uniqueIdentifier)
    $self.find('.upload-btns').hide()
  })
  r.on('fileError', function (file, message) {
    $('#' + file.uniqueIdentifier + ' .msg').html('Upload failed')
    $('#' + file.uniqueIdentifier + ' .progress-bar').css('width', '0%')
    const $self = $('#' + file.uniqueIdentifier)
    $self.find('.upload-pause').hide()
  })
  r.on('fileProgress', function (file) {
    const percent = Math.floor(file.progress() * 100)
    $('#' + file.uniqueIdentifier + ' .progress-bar').css('width', percent + '%')

    // presentation of totalised datasize percentages
    let totalSize = 0
    let totalSizeUploaded = 0
    // presentation of totalised file counts
    let countTotal = 0
    let countTotalCompleted = 0
    $.each(r.files, function (key, flowFile) {
      // id has to be present in frontend as r.files contains all files (including the ones already uploaded)
      if ($('#' + flowFile.uniqueIdentifier).length) {
        // size totals
        totalSize += flowFile.size
        totalSizeUploaded += flowFile.size * flowFile.progress()
        // count totals
        countTotal++
        if (flowFile.progress() === 1) {
          countTotalCompleted++
        }
      }
    })
    $('.uploads-progress-information').html('&nbsp;-&nbsp;completed ' + countTotalCompleted.toString() + ' of ' + countTotal.toString())
    $('.uploads-total-progress-bar').css('width', Math.floor((totalSizeUploaded / totalSize) * 100) + '%')
    $('.uploads-total-progress-bar-perc').html(Math.floor((totalSizeUploaded / totalSize) * 100) + '%')
  })

  $('body').on('dragbetterenter', function (event) {
    $('.upload-drop').addClass('drag-upload')
    Yoda.set_message('success', 'Drop the files to the file browser.')
  })

  $('body').on('dragbetterleave', function (event) {
    $('.upload-drop').removeClass('drag-upload')
    $('#messages').html('')
  })

  $('body').on('click', 'a.view-video', function () {
    const path = $(this).attr('data-path')
    const viewerHtml = `<video width="640" controls autoplay><source src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}"></video>`
    $('#viewer').html(viewerHtml)
    $('#viewMedia').modal('show')
  })

  $('body').on('click', 'a.view-audio', function () {
    const path = $(this).attr('data-path')
    const viewerHtml = `<audio width="640" controls autoplay><source src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}"></audio>`
    $('#viewer').html(viewerHtml)
    $('#viewMedia').modal('show')
  })

  $('body').on('click', 'a.view-image', function () {
    const path = $(this).attr('data-path')
    const viewerHtml = `<img width="640" src="browse/download?filepath=${htmlEncode(encodeURIComponent(path))}" />`
    $('#viewer').html(viewerHtml)
    $('#viewMedia').modal('show')
  })

  $('#viewMedia.modal').on('hidden.bs.modal', function () {
    $('#viewer').html('')
  })

  $('body').on('click', '.browse', function (e) {
    browse($(this).attr('data-path'), true)
    // Dismiss stale messages.
    $('#messages .close').trigger('click')
    e.preventDefault()
  })

  $('body').on('click', "input:checkbox[name='multiSelect[]']", function () {
    if ($("input:checkbox[name='multiSelect[]']:checked").length) {
      $('#multiSelect').removeClass('hide')
    } else {
      $('#multiSelect').addClass('hide')
    }
  })

  $('body').on('click', "input:checkbox[id='multi-select-all']", function () {
    if ($(this).is(':checked')) {
      if ($("input:checkbox[name='multiSelect[]']").length) {
        $("input:checkbox[name='multiSelect[]']").prop('checked', true)
        $('#multiSelect').removeClass('hide')
      }
    } else {
      $("input:checkbox[name='multiSelect[]']").prop('checked', false)
      $('#multiSelect').addClass('hide')
    }
  })

  // hide file browser pagination when there is more then one page
  $('#file-browser').on('processing.dt', function () {
    const pages = $('li.page-item').length

    // previous and next buttons are also counted
    if (pages > 3) {
      $('#file-browser_paginate').show()
    } else {
      $('#file-browser_paginate').hide()
    }
  })

  dragElement(document.getElementById('uploads'))
})

// draggability of the upload overview div
function dragElement (elmnt) {
  let pos1 = 0; let pos2 = 0; let pos3 = 0; let pos4 = 0
  if (document.getElementById('uploads_header')) {
    document.getElementById('uploads_header').onmousedown = dragMouseDown
  } else {
    elmnt.onmousedown = dragMouseDown
  }

  function dragMouseDown (e) {
    e = e || window.event
    e.preventDefault()
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement
    document.onmousemove = elementDrag
  }

  function elementDrag (e) {
    e = e || window.event
    e.preventDefault()
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    elmnt.style.top = (elmnt.offsetTop - pos2) + 'px'
    elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px'
  }

  function closeDragElement () {
    document.onmouseup = null
    document.onmousemove = null
  }
}

async function handleFolderAdd (newFolder, collection) {
  if (!newFolder.length) {
    fileMgmtDialogAlert('folder-create', 'Please add a folder name')
    return
  }

  const result = await Yoda.call('research_folder_add',
    {
      coll: Yoda.basePath + collection,
      new_folder_name: newFolder
    },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    Yoda.set_message('success', 'Successfully added new folder: ' + newFolder + ' to ' + collection)
    browse(collection, true)
    $('#folder-create').modal('hide')
  } else {
    fileMgmtDialogAlert('folder-create', result.status_info)
  }
}

async function handleFolderRename (newFolderName, collection, orgFolderName) {
  if (!newFolderName.length) {
    fileMgmtDialogAlert('folder-rename', 'Please add a new folder name')
    return
  }

  const result = await Yoda.call('research_folder_rename',
    {
      new_folder_name: newFolderName,
      coll: Yoda.basePath + collection,
      org_folder_name: orgFolderName
    },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    Yoda.set_message('success', 'Successfully renamed folder to ' + newFolderName)
    browse(collection, true)
    $('#folder-rename').modal('hide')
  } else {
    fileMgmtDialogAlert('folder-rename', result.status_info)
  }
}

async function handleFolderDelete (collection, folderName) {
  const result = await Yoda.call('research_folder_delete',
    {
      coll: Yoda.basePath + collection,
      folder_name: folderName
    },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    Yoda.set_message('success', 'Successfully deleted folder ' + folderName)
    browse(collection, true)
    $('#folder-delete').modal('hide')
  } else {
    fileMgmtDialogAlert('folder-delete', result.status_info)
  }
}

async function handleFileRename (newFileName, collection, origFileName) {
  if (!newFileName.length) {
    fileMgmtDialogAlert('file-rename', 'Please add a new file name')
    return
  }

  const result = await Yoda.call('research_file_rename',
    {
      new_file_name: newFileName,
      coll: Yoda.basePath + collection,
      org_file_name: origFileName
    },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    Yoda.set_message('success', 'Successfully renamed file to ' + newFileName)
    browse(collection, true)
    $('#file-rename').modal('hide')
  } else {
    fileMgmtDialogAlert('file-rename', result.status_info)
  }
}

async function handleFileDelete (collection, fileName) {
  const result = await Yoda.call('research_file_delete',
    {
      coll: Yoda.basePath + collection,
      file_name: fileName
    },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    Yoda.set_message('success', 'Successfully deleted file ' + fileName)
    browse(collection, true)
    $('#file-delete').modal('hide')
  } else {
    fileMgmtDialogAlert('file-delete', result.status_info)
  }
}

function fileMgmtDialogAlert (dlgName, alert) {
  // Alerts regarding folder/file management
  // Inside the modals
  if (alert.length) {
    $('#alert-panel-' + dlgName + ' span').html(alert)
    $('#alert-panel-' + dlgName).show()
  } else {
    $('#alert-panel-' + dlgName).hide()
  }
}

function changeBrowserUrl (path) {
  let url = window.location.pathname
  if (typeof path !== 'undefined') {
    url += '?dir=' + encodeURIComponent(path)
  }

  history.pushState({}, {}, url)
}

function browse (dir = '', changeHistory = false) {
  currentFolder = dir
  makeBreadcrumb(dir)
  if (changeHistory) { changeBrowserUrl(dir) }

  buildFileBrowser(dir)
  $('button.upload').attr('data-path', dir)
  $('button.upload-folder').attr('data-path', dir)
  $('button.folder-create').attr('data-path', dir)
}

function makeBreadcrumb (dir) {
  const pathParts = dir.split('/').filter(x => x.length)

  // [[Crumb text, Path]] - e.g. [...['x', '/research-a/x']]
  const crumbs = [['My deposits', ''],
    ...Array.from(pathParts.entries())
      .map(([i, x]) => [x, '/' + pathParts.slice(0, i + 1).join('/')])]

  let html = ''
  for (let [i, [text, path]] of crumbs.entries()) {
    // Skip deposit group level.
    if (i !== 1) {
      const el = $('<li class="breadcrumb-item">')
      text = htmlEncode(text).replace(/ /g, '&nbsp;')
      if (i === crumbs.length - 1) {
        el.addClass('active').html(text)
      } else {
        if (i === 0) {
          el.html(`<a data-path="${htmlEncode(path)}" href="/deposit/browse">${text}</a>`)
        } else {
          el.html(`<a data-path="${htmlEncode(path)}" href="/deposit/data?dir=${encodeURIComponent(path)}">${text}</a>`)
        }
      }
      html += el[0].outerHTML
    }
  }

  $('nav ol.breadcrumb').html(html)
}

function htmlEncode (value) {
  // create a in-memory div, set it's inner text(which jQuery automatically encodes)
  // then grab the encoded contents back out.  The div never exists on the page.
  return $('<div/>').text(value).html().replace('"', '&quot;')
}

function buildFileBrowser (dir) {
  const fileBrowser = $('#file-browser').DataTable()
  getFolderContents.dropCache()
  fileBrowser.ajax.reload()

  return true
}

// Fetches directory contents to populate the listing table.
const getFolderContents = (() => {
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
         currentFolder === cacheFolder &&
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
          coll: Yoda.basePath + currentFolder,
          offset: args.start,
          limit: batchSize,
          sort_order: args.order[0].dir,
          sort_on: ['name', 'size', 'modified'][args.order[0].column - 1],
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
      cacheFolder = currentFolder
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

// Functions for rendering table cells, per column.
const tableRenderer = {
  multiselect: (name, _, row) => {
    const tgt = `${currentFolder}/${name}`
    let checkbox = ''
    if (currentFolder) {
      checkbox = `<input class="form-check-input ms-1" type="checkbox" name="multiSelect[]" value="${htmlEncode(tgt)}" data-name="${htmlEncode(name)}" data-type="${row.type}">`
    }
    return checkbox
  },
  name: (name, _, row) => {
    const tgt = `${currentFolder}/${name}`
    if (row.type === 'coll') { return `<a class="coll browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${htmlEncode(tgt)}"><i class="fa-regular fa-folder"></i> ${htmlEncode(name)}</a>` } else return `<i class="fa-regular fa-file"></i> ${htmlEncode(name)}`
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
    const actions = $('<div class="dropdown-menu">')

    if (row.type === 'coll') {
      // no context menu for toplevel group-collections - these cannot be altered or deleted
      if (currentFolder.length === 0) {
        return ''
      }

      // Context menu folder
      actions.append(`<a href="#" class="dropdown-item folder-rename" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Rename this folder" >Rename</a>`)
      actions.append(`<a href="#" class="dropdown-item folder-copy" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Copy this folder">Copy</a>`)
      actions.append(`<a href="#" class="dropdown-item folder-move" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Move this folder">Move</a>`)
      actions.append(`<a href="#" class="dropdown-item folder-delete" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Delete this file">Delete</a>`)
    } else {
      // Context menu for files
      const viewExts = {
        image: ['jpg', 'jpeg', 'gif', 'png', 'webp'],
        audio: ['aac', 'flac', 'mp3', 'ogg', 'wav'],
        video: ['mp4', 'ogg', 'webm']
      }
      const ext = row.name.replace(/.*\./, '').toLowerCase()

      actions.append(`<a class="dropdown-item file-download" href="browse/download?filepath=${encodeURIComponent(currentFolder + '/' + row.name)}" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Download this file">Download</a>`)

      // Generate dropdown "view" actions for different media types.
      for (const type of Object.keys(viewExts).filter(type => (viewExts[type].includes(ext)))) {
        actions.append(`<a class="dropdown-item view-${type}" data-path="${htmlEncode(currentFolder + '/' + row.name)}" title="View this file">View</a>`)
      }

      actions.append(`<a href="#" class="dropdown-item file-rename" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Rename this file">Rename</a>`)
      actions.append(`<a href="#" class="dropdown-item file-copy" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Copy this file">Copy</a>`)
      actions.append(`<a href="#" class="dropdown-item file-move" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Move this file">Move</a>`)
      actions.append(`<a href="#" class="dropdown-item file-delete" data-collection="${htmlEncode(currentFolder)}" data-name="${htmlEncode(row.name)}" title="Delete this file">Delete</a>`)
    }
    const dropdown = $(`<div class="dropdown">
                            <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-name="${htmlEncode(row.name)}" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                              <i class="fa-solid fa-ellipsis-h" aria-hidden="true"></i>
                            </button>`)
    dropdown.append(actions)

    return dropdown[0].outerHTML
  }
}

function startBrowsing () {
  $('#file-browser').DataTable({
    bFilter: false,
    bInfo: false,
    bLengthChange: true,
    language: {
      emptyTable: 'Drag and drop files and folders here',
      lengthMenu: '_MENU_'
    },
    dom: '<"top">frt<"bottom"lp><"clear">',
    columns: [{ render: tableRenderer.multiselect, orderable: false, data: 'name' },
      { render: tableRenderer.name, data: 'name' },
      // Size and date should be orderable, but limitations
      // on how queries work prevent us from doing this
      // correctly without significant overhead.
      // (enabling this as is may result in duplicated results for data objects)
      { render: tableRenderer.size, data: 'size' },
      { render: tableRenderer.date, orderable: false, data: 'modify_time' },
      { render: tableRenderer.context, orderable: false }],
    ajax: getFolderContents,
    processing: true,
    serverSide: true,
    iDeferLoading: 0,
    order: [[1, 'asc']],
    pageLength: parseInt(Yoda.settings.number_of_items)
  })
  browse(currentFolder)
}

window.addEventListener('popstate', function (e) {
  // Catch forward/backward navigation and reload the view.
  const query = window.location.search.substr(1).split('&').reduce(
    function (acc, kv) {
      const xy = kv.split('=', 2)
      acc[xy[0]] = xy.length === 1 || decodeURIComponent(xy[1])
      return acc
    }, {})

  browse('dir' in query ? query.dir : '')
})

function logUpload (id, file) {
  const log = `<div class="row upload-row mb-1" id="${id}">
                  <div class="col-md-6">
                    <div class="upload-filename text-break">${htmlEncode(file.relativePath)}</div>
                    <div class="upload-btns btn-group btn-group-sm ms-3" role="group" aria-label="Basic example">
                      <button type="button" class="btn btn-secondary upload-pause me-1">Pause</button>
                      <button type="button" class="btn btn-secondary upload-resume me-1 hide">Resume</button>
                      <button type="button" class="btn btn-secondary upload-cancel me-1">Cancel</button>
                    </div>
                  </div>
                  <div class="col-md-3"><div class="progress"><div class="progress-bar progress-bar-striped bg-info"></div></div></div>
                  <div class="col-md-3 msg"><i class="fa-solid fa-spinner fa-spin fa-fw"></i></div>
               </div>`
  $('#files').append(log)
}

function handleActionsList (actions, folder) {
  let html = ''

  const possibleActions = ['show-checksum-report']

  $.each(possibleActions, function (index, value) {
    if (Object.prototype.hasOwnProperty.call(actions, value)) {
      html += '<a class="dropdown-item action-' + value + '" data-folder="' + htmlEncode(folder) + '">' + actions[value] + '</a>'
    }
  })

  $('.action-list').html(html)
}
