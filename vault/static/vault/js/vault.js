/* global Option */
'use strict'

$(document).ajaxSend(function (e, request, settings) {
  // Append a CSRF token to all AJAX POST requests.
  if (settings.type === 'POST' && settings.data.length) {
    settings.data +=
             '&' + encodeURIComponent(Yoda.csrf.tokenName) +
              '=' + encodeURIComponent(Yoda.csrf.tokenValue)
  }
})

let preservableFormatsLists = null
let currentFolder
let dataPackage = null

$(function () {
  // Extract current location from query string (default to '').
  currentFolder = decodeURIComponent((/(?:\?|&)dir=([^&]*)/
    .exec(window.location.search) || [0, ''])[1])

  // Canonicalize path somewhat, for convenience.
  currentFolder = currentFolder.replace(/\/+/g, '/').replace(/\/$/, '')

  if ($('#file-browser').length) {
    // startBrowsing(browsePageItems);
    startBrowsing()
  }

  $('.btn-go-to-research').on('click', function () {
    window.location.href = '/research/?dir=' + encodeURIComponent('/' + $(this).attr('research-area'))
  })

  $('.btn-group button.metadata-form').on('click', function () {
    showMetadataForm($(this).attr('data-path'))
  })

  $('body').on('click', 'a.view-video', function () {
    const path = $(this).attr('data-path')
    const viewerHtml = `<video width="640" controls autoplay><source src="browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(path))}"></video>`
    $('#viewer').html(viewerHtml)
    $('#viewMedia').modal('show')
  })

  $('body').on('click', 'a.view-audio', function () {
    const path = $(this).attr('data-path')
    const viewerHtml = `<audio width="640" controls autoplay><source src="browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(path))}"></audio>`
    $('#viewer').html(viewerHtml)
    $('#viewMedia').modal('show')
  })

  $('body').on('click', 'a.view-image', function () {
    const path = $(this).attr('data-path')
    const viewerHtml = `<img width="640" src="browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(path))}" />`
    $('#viewer').html(viewerHtml)
    $('#viewMedia').modal('show')
  })

  $('#viewMedia.modal').on('hidden.bs.modal', function () {
    $('#viewer').html('')
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

      table += '<thead><tr><th>Filename</th><th>Size</th><th>Checksum</th></tr></thead>'
      $.each(data, function (index, obj) {
        table += `<tr>
                     <td>${obj.name}</td>
                     <td>${obj.size}</td>
                     <td>${obj.checksum}</td>
                </tr>`
      })
      table += '</tbody></table>'

      $('#showChecksumReport .modal-body #checksumReport').html(table)
      $('#showChecksumReport').modal('show')
    })
  })

  $('body').on('click', 'a.action-check-for-unpreservable-files', function () {
    // Check for unpreservable file formats.
    // If present, show extensions to user.
    $('#file-formats-list').val('')

    $('#showUnpreservableFiles .help').hide()
    $('#showUnpreservableFiles .preservable').hide()
    $('#showUnpreservableFiles .advice').hide()
    $('#showUnpreservableFiles .unpreservable').hide()
    $('#showUnpreservableFiles .checking').hide()

    if (preservableFormatsLists === null) {
      // Retrieve preservable file format lists.
      Yoda.call('vault_preservable_formats_lists').then((data) => {
        preservableFormatsLists = data

        $('#file-formats-list').html("<option value='' disabled selected>Select a file format list</option>")
        for (const list in data) {
          if (Object.prototype.hasOwnProperty.call(data, list)) {
            $('#file-formats-list').append(new Option(data[list].name, list))
          }
        }
        $('#showUnpreservableFiles').modal('show')
      })
    } else {
      $('#showUnpreservableFiles').modal('show')
    }
  })

  $('#file-formats-list').on('change', function () {
    const folder = $('a.action-check-for-unpreservable-files').attr('data-folder')
    const list = $('#file-formats-list option:selected').val()
    if (!(list in preservableFormatsLists)) { return }

    $('#showUnpreservableFiles .checking').show()
    $('#showUnpreservableFiles .unpreservable').hide()
    $('#showUnpreservableFiles .preservable').hide()
    $('#showUnpreservableFiles .advice').hide()
    $('#showUnpreservableFiles .help').hide()

    $('#showUnpreservableFiles .help').text(preservableFormatsLists[list].help)
    $('#showUnpreservableFiles .advice').text(preservableFormatsLists[list].advice)

    // Retrieve unpreservable files in folder.
    Yoda.call('vault_unpreservable_files',
      { coll: Yoda.basePath + folder, list_name: list }).then((data) => {
      $('#showUnpreservableFiles .checking').hide()
      $('#showUnpreservableFiles .help').show()
      if (data.length > 0) {
        $('#showUnpreservableFiles .list-unpreservable-formats').html('')
        for (const ext of data) { $('#showUnpreservableFiles .list-unpreservable-formats').append(`<li>${Yoda.htmlEncode(ext)}</li>`) }
        $('#showUnpreservableFiles .advice').show()
        $('#showUnpreservableFiles .unpreservable').show()
      } else {
        $('#showUnpreservableFiles .preservable').show()
      }
      $('#showUnpreservableFiles').modal('show')
    })
  })

  $('body').on('click', 'a.action-submit-for-publication', function () {
    $('.action-confirm-submit-for-publication').attr('data-folder', $(this).attr('data-folder'))

    const folder = $(this).attr('data-folder')
    const vault = String(folder.match(/.*\//)).replace(/\/+$/, '')
    dataPackage = null
    $('.previousPublications').html('')
    Yoda.call('vault_get_published_packages', { path: Yoda.basePath + vault }).then((data) => {
      if (Object.keys(data).length > 0) {
        let i = 0
        $.each(data, function (doi, publication) {
          i++
          const vaultPath = publication.path.replace(Yoda.basePath, '')
          $('.previousPublications').append(`
<div class="form-check">
  <input class="form-check-input" type="radio" name="dataPackageSelect" id="dataPackage${i}" value="${Yoda.htmlEncode(publication.path)}">
  <label class="form-check-label" for="dataPackage${i}">
    ${Yoda.htmlEncode(doi)} (<a target="_blank" href="?dir=${encodeURIComponent(vaultPath)}">${Yoda.htmlEncode(publication.title)}</a>)
  </label>
</div>
`)
        })
      } else {
        $('.previousPublications').html('No previously published data packages available.')
      }

      $('#submitPublication').modal('show')
    })
  })

  $('body').on('click', 'a.action-vault-download', function () {
    $('.action-confirm-vault-download').attr('data-folder', $(this).attr('data-folder'))
    $('#vaultDownload').modal('show')
  })

  $('body').on('click', 'a.action-vault-archival', function () {
    $('.action-confirm-vault-archival').attr('data-folder', $(this).attr('data-folder'))
    $('#vaultArchival').modal('show')
  })

  $('body').on('click', 'a.action-vault-unarchive', function () {
    $('.action-confirm-vault-unarchive').attr('data-folder', $(this).attr('data-folder'))
    $('#vaultUnarchive').modal('show')
  })

  $('body').on('click', 'button.action-confirm-data-package-select', function () {
    dataPackage = $('#submitPublication .modal-body input[type="radio"]:checked').val()
    $('#submitPublication').modal('hide')

    $('#confirmAgreementConditions .modal-body').text('') // clear it first

    Yoda.call('vault_get_publication_terms', {}).then((data) => {
      $('#confirmAgreementConditions .modal-body').html(data)

      // Set default status and show dialog.
      $('.action-confirm-submit-for-publication').prop('disabled', true)
      $('#confirmAgreementConditions .confirm-conditions').prop('checked', false)

      $('#confirmAgreementConditions').modal('show')
    })
  })

  $('#confirmAgreementConditions').on('click', '.confirm-conditions', function () {
    if ($(this).prop('checked')) {
      $('#confirmAgreementConditions .action-confirm-submit-for-publication').prop('disabled', false)
    } else {
      $('#confirmAgreementConditions .action-confirm-submit-for-publication').prop('disabled', true)
    }
  })

  $('#confirmAgreementConditions').on('click', '.action-confirm-submit-for-publication', function () {
    $('#confirmAgreementConditions').modal('hide')
    vaultSubmitForPublication($(this).attr('data-folder'))
  })

  $('body').on('click', 'a.action-approve-for-publication', function () {
    vaultApproveForPublication($(this).attr('data-folder'))
  })

  $('body').on('click', 'a.action-cancel-publication', function () {
    vaultCancelPublication($(this).attr('data-folder'))
  })

  $('body').on('click', 'i.actionlog-icon', function () {
    toggleActionLogList($(this).attr('data-folder'))
  })

  $('body').on('click', 'i.system-metadata-icon', function () {
    toggleSystemMetadata($(this).attr('data-folder'))
  })

  $('body').on('click', '.browse', function (e) {
    browse($(this).attr('data-path'), true)
    // Dismiss stale messages.
    $('#messages .close').trigger('click')
    e.preventDefault()
  })

  $('body').on('click', 'a.action-grant-vault-access', function () {
    vaultAccess('grant', $(this).attr('data-folder'))
  })

  $('body').on('click', 'a.action-revoke-vault-access', function () {
    vaultAccess('revoke', $(this).attr('data-folder'))
  })

  $('body').on('click', 'a.action-depublish-publication', function () {
    // Set the current folder.
    $('.action-confirm-depublish-publication').attr('data-folder', $(this).attr('data-folder'))
    // Show depublish modal.
    $('#confirmDepublish').modal('show')
  })

  $('#confirmDepublish').on('click', '.action-confirm-depublish-publication', function () {
    $('#confirmDepublish').modal('hide')
    vaultDepublishPublication($(this).attr('data-folder'))
  })

  $('body').on('click', 'a.action-republish-publication', function () {
    // Set the current folder.
    $('.action-confirm-republish-publication').attr('data-folder', $(this).attr('data-folder'))
    // Show depublish modal.
    $('#confirmRepublish').modal('show')
  })

  $('#confirmRepublish').on('click', '.action-confirm-republish-publication', function () {
    $('#confirmRepublish').modal('hide')
    vaultRepublishPublication($(this).attr('data-folder'))
  })

  $('#vaultDownload').on('click', '.action-confirm-vault-download', function () {
    $('#vaultDownload').modal('hide')
    vaultDownload($(this).attr('data-folder'))
  })

  $('#vaultArchival').on('click', '.action-confirm-vault-archival', function () {
    $('#vaultArchival').modal('hide')
    vaultArchival($(this).attr('data-folder'))
  })

  $('#vaultUnarchive').on('click', '.action-confirm-vault-unarchive', function () {
    $('#vaultUnarchive').modal('hide')
    vaultUnarchive($(this).attr('data-folder'))
  })

  // FILE stage
  $('body').on('click', 'a.file-stage', function () {
    handleFileStage($(this).attr('data-collection'), $(this).attr('data-name'))
  })
})

function changeBrowserUrl (path) {
  let url = window.location.pathname
  if (typeof path !== 'undefined') {
    url += '?dir=' + encodeURIComponent(path)
  }

  window.history.pushState({}, {}, url)
}

function browse (dir = '', changeHistory = false) {
  currentFolder = dir
  // remove hide class that could have been added when a erroneous vault path was used.
  $('#file-browser_wrapper').removeClass('hide')
  handleGoToResearchButton(dir)
  makeBreadcrumb(dir)
  if (changeHistory) { changeBrowserUrl(dir) }

  // Used to initially hide Metadata info, alerts
  const pathParts = dir.split('/')
  // Do not show metadata outside data package.
  if (pathParts.length < 3) {
    $('.metadata-info').hide()
    $('.alert.is-archived').hide()
    $('.alert.is-processing').hide()
  }
  topInformation(dir, true) // only here topInformation should show its alertMessage
  buildFileBrowser(dir)
}

function handleGoToResearchButton (dir) {
  // Handle the button with which to return to the corresponding research area.
  const parts = dir.split('/')

  if (parts.length > 1) {
    $('.btn-go-to-research').attr('research-area', parts[1].replace('vault-', 'research-')).show()
  } else {
    $('.btn-go-to-research').attr('research-area', '').hide()
  }
}

function makeBreadcrumb (dir) {
  const pathParts = dir.split('/').filter(x => x.length)

  // [[Crumb text, Path]] - e.g. [...['x', '/research-a/x']]
  const crumbs = [['Vault', ''],
    ...Array.from(pathParts.entries())
      .map(([i, x]) => [x, '/' + pathParts.slice(0, i + 1).join('/')])]

  let html = ''
  for (let [i, [text, path]] of crumbs.entries()) {
    const el = $('<li class="breadcrumb-item">')
    text = Yoda.htmlEncode(text).replace(/ /g, '&nbsp;')
    if (i === crumbs.length - 1) { el.addClass('active').html(text) } else {
      el.html(`<a class="browse" data-path="${Yoda.htmlEncode(path)}"
                         href="?dir=${encodeURIComponent(path)}">${text}</a>`)
    }

    html += el[0].outerHTML
  }

  $('ol.breadcrumb').html(html)
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
          sort_on: ['name', 'size', 'modified'][args.order[0].column],
          space: 'Space.VAULT'
        },
        { quiet: true, rawResult: false }
      )

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
  name: (name, _, row) => {
    const tgt = `${currentFolder}/${name}`
    if (row.type === 'coll') { return `<a class="coll browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${Yoda.htmlEncode(tgt)}"><i class="fa-regular fa-folder"></i> ${Yoda.htmlEncode(name)}</a>` } else return `<i class="fa-regular fa-file"></i> ${Yoda.htmlEncode(name)}`
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
  state: (_, __, row) => {
    let state = $('<span>')
    if (row.type === 'data' && row.state === 'OFL') {
      state = $('<span class="badge bg-secondary" title="Stored offline on tape archive">Offline</span>')
    } else if (row.type === 'data' && row.state === 'UNM') {
      state = $('<span class="badge bg-secondary" title="Migrating from tape archive to disk">Bringing online</span>')
    } else if (row.type === 'data' && row.state === 'MIG') {
      state = $('<span class="badge bg-secondary" title="Migrating from disk to tape archive">Storing offline</span>')
    }
    return state[0].outerHTML
  },
  context: (_, __, row) => {
    const actions = $('<div class="dropdown-menu">')

    if (row.type === 'coll') { return '' }

    if (row.state === 'OFL') {
      actions.append(`<a href="#" class="dropdown-item file-stage" data-collection="${Yoda.htmlEncode(currentFolder)}" data-name="${Yoda.htmlEncode(row.name)}" title="Bring this file online">Bring online</a>`)
    } else if (row.state === 'MIG' || row.state === 'UNM') {
      // no context menu for data objects migrating from or to tape archive
      return ''
    } else {
      // Render context menu for files.
      const viewExts = {
        image: ['jpg', 'jpeg', 'gif', 'png', 'webp'],
        audio: ['aac', 'flac', 'mp3', 'ogg', 'wav'],
        video: ['mp4', 'ogg', 'webm']
      }
      const ext = row.name.replace(/.*\./, '').toLowerCase()

      actions.append(`<a class="dropdown-item file-download" href="browse/download?filepath=${encodeURIComponent(currentFolder + '/' + row.name)}" data-collection="${Yoda.htmlEncode(currentFolder)}" data-name="${Yoda.htmlEncode(row.name)}" title="Download this file">Download</a>`)

      // Generate dropdown "view" actions for different media types.
      for (const type of Object.keys(viewExts).filter(type => (viewExts[type].includes(ext)))) {
        actions.append(`<a class="dropdown-item view-${type}" data-path="${Yoda.htmlEncode(currentFolder + '/' + row.name)}" title="View this file">View</a>`)
      }
    }

    const dropdown = $(`<div class="dropdown">
                            <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-name="${Yoda.htmlEncode(row.name)}" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                              <i class="fa-solid fa-ellipsis-h" aria-hidden="true"></i>
                            </button>`)
    dropdown.append(actions)

    return dropdown[0].outerHTML
  }
}

function startBrowsing () {
  // $('#file-browser_wrapper').removeClass('hide');

  $('#file-browser').DataTable({
    bFilter: false,
    bInfo: false,
    bLengthChange: true,
    language: {
      emptyTable: 'No accessible files/folders present',
      lengthMenu: '_MENU_'
    },
    dom: '<"top">frt<"bottom"lp><"clear">',
    columns: [{ render: tableRenderer.name, data: 'name' },
      // Size and date should be orderable, but limitations
      // on how queries work prevent us from doing this
      // correctly without significant overhead.
      // (enabling this as is may result in duplicated results for data objects)
      { render: tableRenderer.size, data: 'size' },
      { render: tableRenderer.date, orderable: false, data: 'modify_time' },
      { render: tableRenderer.state, orderable: false },
      { render: tableRenderer.context, orderable: false }],
    ajax: getFolderContents,
    processing: true,
    serverSide: true,
    iDeferLoading: 0,
    pageLength: parseInt(Yoda.storage.session.get('pageLength') === null ? Yoda.settings.number_of_items : Yoda.storage.session.get('pageLength'))
  })
  $('#file-browser').on('length.dt', function (e, settings, len) {
    Yoda.storage.session.set('pageLength', len)
  })
  browse(currentFolder)
}

function toggleActionLogList (folder) {
  const actionList = $('.actionlog')
  const actionListItems = $('.actionlog-items')

  const isVisible = actionList.is(':visible')

  // toggle locks list
  if (isVisible) {
    actionList.hide()
  } else {
    // Get provenance information
    Yoda.call('provenance_log', { coll: Yoda.basePath + folder }).then((data) => {
      actionList.hide()
      let html = ''
      if (data.length) {
        $.each(data, function (index, value) {
          html += '<a class="list-group-item list-group-item-action">' +
                         Yoda.htmlEncode(value[2]) +
                         ' - <strong>' +
                         Yoda.htmlEncode(value[1]) +
                         '</strong> - ' +
                         Yoda.htmlEncode(value[0]) +
                         '</a>'
        })
      } else {
        html += '<a class="list-group-item list-group-item-action">No provenance information present</a>'
      }
      actionListItems.html(html)
      actionList.show()
    })
  }
}

function toggleSystemMetadata (folder) {
  const systemMetadata = $('.system-metadata')
  const systemMetadataItems = $('.system-metadata-items')

  const isVisible = systemMetadata.is(':visible')

  // Toggle system metadata.
  if (isVisible) {
    systemMetadata.hide()
  } else {
    // Retrieve system metadata of folder.
    Yoda.call('vault_system_metadata', { coll: Yoda.basePath + folder }).then((data) => {
      systemMetadata.hide()
      let html = ''
      if (data) {
        $.each(data, function (index, value) {
          html += '<span class="list-group-item list-group-item-action"><strong>' +
                        Yoda.htmlEncode(index) +
                        '</strong>: ' +
                        value +
                        '</span>'
        })
      } else {
        html += '<a class="list-group-item list-group-item-action">No system metadata present</a>'
      }
      systemMetadataItems.html(html)
      systemMetadata.show()
    })
  }
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

function topInformation (dir, showAlert) {
  if (typeof dir !== 'undefined') {
    Yoda.call('vault_collection_details',
      { path: Yoda.basePath + dir },
      { quiet: true, rawResult: true }).then((dataRaw) => {
      const data = dataRaw.data
      if (dataRaw.status === 'error_nonexistent') {
        Yoda.set_message('error', 'This vault space path does not exists: ' + dir)
        $('#file-browser_wrapper').addClass('hide')
        $('.top-information').addClass('hide')

        // no more action required here
        return true
      }

      let statusText = ''
      let archiveBadge = ''
      const vaultStatus = data.status
      const vaultActionPending = data.vault_action_pending
      const hasWriteRights = 'yes'
      const hasDatamanager = data.has_datamanager
      const isDatamanager = data.is_datamanager
      const researchGroupAccess = data.research_group_access
      const actions = []
      const downloadable = data.downloadable
      const archive = data.archive

      $('.btn-group button.metadata-form').hide()
      $('.top-information').hide()
      $('.top-info-buttons').hide()

      // is vault package
      if (typeof vaultStatus !== 'undefined') {
        actions['copy-vault-package-to-research'] = 'Copy datapackage to research space'

        // folder status (vault folder)
        if (typeof vaultStatus !== 'undefined' && typeof vaultActionPending !== 'undefined') {
          $('.btn-group button.folder-status').attr('data-datamanager', isDatamanager)

          // Set status badge.
          if (vaultStatus === 'SUBMITTED_FOR_PUBLICATION') {
            statusText = 'Submitted for publication'
          } else if (vaultStatus === 'APPROVED_FOR_PUBLICATION') {
            statusText = 'Approved for publication'
          } else if (vaultStatus === 'PUBLISHED') {
            statusText = 'Published'
          } else if (vaultStatus === 'DEPUBLISHED') {
            statusText = 'Depublished'
          } else if (vaultStatus === 'PENDING_DEPUBLICATION') {
            statusText = 'Depublication pending'
          } else if (vaultStatus === 'PENDING_REPUBLICATION') {
            statusText = 'Republication pending'
          } else {
            statusText = 'Unpublished'
          }

          // Set actions for datamanager and researcher.
          if (!vaultActionPending) {
            if (isDatamanager) {
              if (vaultStatus === 'SUBMITTED_FOR_PUBLICATION') {
                actions['cancel-publication'] = 'Cancel publication'
                actions['approve-for-publication'] = 'Approve for publication'
              } else if (vaultStatus === 'UNPUBLISHED') {
                actions['submit-for-publication'] = 'Submit for publication'
              } else if (vaultStatus === 'PUBLISHED') {
                actions['depublish-publication'] = 'Depublish publication'
              } else if (vaultStatus === 'DEPUBLISHED') {
                actions['republish-publication'] = 'Republish publication'
              }
            } else if (hasDatamanager) {
              if (vaultStatus === 'UNPUBLISHED') {
                actions['submit-for-publication'] = 'Submit for publication'
              } else if (vaultStatus === 'SUBMITTED_FOR_PUBLICATION') {
                actions['cancel-publication'] = 'Cancel publication'
              }
            }
          }

          // Show metadata button.
          $('.btn-group button.metadata-form').attr('data-path', dir)
          $('.btn-group button.metadata-form').show()

          // Archival vault
          if (typeof archive !== 'undefined') {
            if ((isDatamanager && archive.archivable) && archive.status === false) {
              actions['vault-archival'] = 'Archive on tape'
            }

            $('.alert.is-archived').hide()
            if (archive.status !== false) {
              let archiveText = archive.status
              if (archive.status === 'archive' || archive.status === 'archiving') {
                archiveText = 'Scheduled for archive'
              } else if (archive.status === 'archived') {
                archiveText = 'Archived'
                if (isDatamanager) {
                  actions['vault-unarchive'] = 'Unarchive from tape'
                }
                $('.alert.is-archived').show()
              } else if (archive.status === 'update' || archive.status === 'updating') {
                archiveText = 'Updating archive'
                $('.alert.is-archived').show()
              } else if (archive.status === 'extract' || archive.status === 'extracting') {
                archiveText = 'Scheduled for unarchive'
              } else if (archive.status === 'bagit' || archive.status === 'baggingit') {
                archiveText = 'Scheduled for download'
              }
              archiveBadge = '<span id="archiveBadge" class="ms-2 badge rounded-pill bg-secondary text-white">' + archiveText + '</span>'
            } else if (downloadable) {
              actions['vault-download'] = 'Download as bagit'
            }
          } else {
            if (downloadable) {
              actions['vault-download'] = 'Download as bagit'
            }
          }
        }

        // Vault in progress of being created
        $('.alert.is-processing').hide()
        if (vaultStatus === '' || vaultStatus === 'INCOMPLETE') {
          $('.alert.is-processing').show()
        } else {
          metadataInfo(dir)
        }

        // Datamanager sees access buttons in vault.
        $('.top-info-buttons').show()
        if (isDatamanager) {
          if (researchGroupAccess) {
            actions['revoke-vault-access'] = 'Revoke read access to research group'
          } else {
            actions['grant-vault-access'] = 'Grant read access to research group'
          }
        }
      }

      // Provenance action log
      $('.actionlog').hide()
      const actionLogIcon = ` <i class="fa-solid fa-book actionlog-icon" data-folder="${Yoda.htmlEncode(dir)}" aria-hidden="true" title="Show provenance information"></i>`

      // System metadata.
      $('.system-metadata').hide()
      const systemMetadataIcon = ` <i class="fa-solid fa-info-circle system-metadata-icon" data-folder="${Yoda.htmlEncode(dir)}" aria-hidden="true" title="Show system metadata"></i>`

      $('.btn-group button.folder-status').attr('data-write', hasWriteRights)

      // Add unpreservable files check to actions.
      actions['check-for-unpreservable-files'] = 'Check for compliance with policy'

      // Add checksum report
      actions['show-checksum-report'] = 'Show checksum report'

      // Handle actions
      handleActionsList(actions, dir)

      const statusBadge = '<span id="statusBadge" class="ml-2 badge rounded-pill bg-primary">' + statusText + '</span>'

      // Reset action dropdown.
      $('.btn-group button.folder-status').prop('disabled', false).next().prop('disabled', false)

      // Folder buttons
      $('.top-information h2').html(`${statusBadge}${archiveBadge}${systemMetadataIcon}${actionLogIcon}`)

      // Show top information and buttons.
      if (typeof vaultStatus !== 'undefined') {
        $('.top-information').show()
        $('.top-info-buttons').show()
      }
    })
  } else {
    $('.top-information').hide()
  }
}

function handleActionsList (actions, folder) {
  let html = ''
  let vaultHtml = ''
  const possibleActions = ['submit-for-publication', 'cancel-publication',
    'approve-for-publication', 'depublish-publication',
    'republish-publication', 'vault-download', 'vault-archival',
    'vault-unarchive']

  const possibleVaultActions = ['grant-vault-access', 'revoke-vault-access',
    'copy-vault-package-to-research',
    'check-for-unpreservable-files',
    'show-checksum-report']

  $.each(possibleActions, function (index, value) {
    if (Object.prototype.hasOwnProperty.call(actions, value)) {
      html += '<a class="dropdown-item action-' + value + '" data-folder="' + Yoda.htmlEncode(folder) + '">' + actions[value] + '</a>'
    }
  })

  $.each(possibleVaultActions, function (index, value) {
    if (Object.prototype.hasOwnProperty.call(actions, value)) {
      vaultHtml += '<a class="dropdown-item action-' + value + '" data-folder="' + Yoda.htmlEncode(folder) + '">' + actions[value] + '</a>'
    }
  })

  if (html !== '' && vaultHtml !== '') {
    html += '<div class="dropdown-divider"></div>' + vaultHtml
  } else if (vaultHtml !== '') {
    html += vaultHtml
  }

  $('.action-list').html(html)
}

function showMetadataForm (path) {
  window.location.href = 'metadata/form?path=' + encodeURIComponent(path)
}

async function vaultSubmitForPublication (folder) {
  const btnText = $('#statusBadge').html()
  $('#statusBadge').html('Submit for publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  $('.btn-group button.folder-status').prop('disabled', true).next().prop('disabled', true)

  try {
    if (dataPackage) {
      await Yoda.call('vault_submit', { coll: Yoda.basePath + folder, previous_version: dataPackage })
    } else {
      await Yoda.call('vault_submit', { coll: Yoda.basePath + folder })
    }
    $('#statusBadge').html('')
  } catch (e) {
    $('#statusBadge').html(btnText)
  }
  topInformation(folder, false)
}

async function vaultApproveForPublication (folder) {
  const btnText = $('#statusBadge').html()
  $('#statusBadge').html('Approve for publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  $('.btn-group button.folder-status').prop('disabled', true).next().prop('disabled', true)

  try {
    await Yoda.call('vault_approve', { coll: Yoda.basePath + folder })
    $('#statusBadge').html('')
  } catch (e) {
    $('#statusBadge').html(btnText)
  }
  topInformation(folder, false)
}

async function vaultCancelPublication (folder) {
  const btnText = $('#statusBadge').html()
  $('#statusBadge').html('Cancel publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  $('.btn-group button.folder-status').prop('disabled', true).next().prop('disabled', true)

  try {
    await Yoda.call('vault_cancel', { coll: Yoda.basePath + folder })
    $('#statusBadge').html('')
  } catch (e) {
    $('#statusBadge').html(btnText)
  }
  topInformation(folder, false)
}

async function vaultDepublishPublication (folder) {
  const btnText = $('#statusBadge').html()
  $('#statusBadge').html('Depublish publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  $('.btn-group button.folder-status').prop('disabled', true).next().prop('disabled', true)

  try {
    await Yoda.call('vault_depublish', { coll: Yoda.basePath + folder })
    $('#statusBadge').html('')
  } catch (e) {
    $('#statusBadge').html(btnText)
  }
  topInformation(folder, false)
}

async function vaultRepublishPublication (folder) {
  const btnText = $('#statusBadge').html()
  $('#statusBadge').html('Republish publication <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  $('.btn-group button.folder-status').prop('disabled', true).next().prop('disabled', true)

  try {
    await Yoda.call('vault_republish', { coll: Yoda.basePath + folder })
    $('#statusBadge').html('')
  } catch (e) {
    $('#statusBadge').html(btnText)
  }
  topInformation(folder, false)
}

async function vaultDownload (folder) {
  $('#archiveBadge').html('Schedule for download <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  $('#archiveBadge').removeClass('hide')

  const result = await Yoda.call('vault_download',
    { coll: Yoda.basePath + folder },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    topInformation(folder, false)
  } else {
    Yoda.set_message('error', 'Failed to bagit data package')
    $('#archiveBadge').hide()
    topInformation(folder, true)
  }
}

async function vaultArchival (folder) {
  $('#archiveBadge').html('Schedule for archive <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  $('#archiveBadge').removeClass('hide')

  const result = await Yoda.call('vault_archive',
    { coll: Yoda.basePath + folder },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    topInformation(folder, false)
  } else {
    Yoda.set_message('error', 'Failed to archive data package')
    $('#archiveBadge').hide()
    topInformation(folder, true)
  }
}

async function vaultUnarchive (folder) {
  $('#archiveBadge').html('Schedule for unarchiving <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  $('#archiveBadge').removeClass('hide')

  const result = await Yoda.call('vault_extract',
    { coll: Yoda.basePath + folder },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    topInformation(folder, false)
  } else {
    Yoda.set_message('error', 'Failed to unarchive data package')
    topInformation(folder, true)
  }
}

function vaultAccess (action, folder) {
  $('.btn-group button.folder-status').prop('disabled', true).next().prop('disabled', true)

  $.post('access', { path: decodeURIComponent(folder), action }, function (data) {
    if (data.data.status !== 'Success') {
      Yoda.set_message('error', data.statusInfo)
    }

    topInformation(folder, false)
  }, 'json')
}

async function handleFileStage (collection, fileName) {
  const result = await Yoda.call('tape_archive_stage',
    { path: Yoda.basePath + collection + '/' + fileName },
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    Yoda.set_message('success', 'Successfully requested to bring file <' + fileName + '> online')
  } else {
    Yoda.set_message('error', 'Failed to request to bring file <' + fileName + '> online')
  }
}

function metadataInfo (dir) {
  /* Loads metadata of the vault packages */
  const pathParts = dir.split('/')
  pathParts.length = 3
  dir = pathParts.join('/')

  try {
    Yoda.call('meta_form_load',
      { coll: Yoda.basePath + dir },
      { quiet: true, rawResult: true })
      .then((result) => {
        if (!result || Object.keys(result.data).length === 0) { return console.info('No result data from meta_form_load') }

        const metadata = result.data.metadata
        $('.metadata-info').show()
        $('.metadata-title').text(metadata.Title)
        $('.metadata-access').text(metadata.Data_Access_Restriction)
        $('.metadata-data-classification').text(metadata.Data_Classification)
        $('.metadata-license').text(metadata.License)

        if (metadata.Description) {
          const description = metadata.Description
          const wordCount = description.match(/(\w+)/g).length
          if (wordCount < 50) {
            $('.metadata-description').text(description)
          } else {
            $('.metadata-description').text(truncate(description, 50))
            $('.read-more-button').show()
            $('.read-more-button').on('click', function () {
              $('.metadata-description').text(description)
              $('.read-more-button').hide()
              $('.read-less-button').show()
            })
            $('.read-less-button').on('click', function () {
              $('.metadata-description').text(truncate(description, 50))
              $('.read-more-button').show()
              $('.read-less-button').hide()
            })
          }
        }

        const creators = []
        for (const c in metadata.Creator) {
          let fullname = ''
          if (typeof metadata.Creator[c].Name === 'string') { fullname = metadata.Creator[c].Name } else if (typeof metadata.Creator[c].Name === 'object') { fullname = ''.concat(metadata.Creator[c].Name.Given_Name, ' ', metadata.Creator[c].Name.Family_Name) }
          creators.push(fullname)
        }
        $('.metadata-creator').text(creators.join(', '))
      })
  } catch (error) {
    console.error(error)
  }
}

function truncate (str, numberOfWords) {
  // Truncate string on n number of words
  return str.split(' ').splice(0, numberOfWords).join(' ')
}
