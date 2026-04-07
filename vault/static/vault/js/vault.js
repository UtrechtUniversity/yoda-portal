/* global $, bootstrap, Option */
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
let currentFile
let previousVersion = null
let hasReadRights = true
let researchGroupAccess = true
let downloadChecksumReportTextTooltip
let downloadChecksumReportCSVTooltip

$(function () {
  createTooltips()

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search)

  // Handle 'dir' parameter
  currentFolder = urlParams.get('dir') || ''
  currentFolder = decodeURIComponent(currentFolder)
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')

  // Handle optional 'scrollTo' parameter
  if (urlParams.has('scrollTo')) {
    currentFile = decodeURIComponent(urlParams.get('scrollTo'))
      .replace(/\/+/g, '/')
      .replace(/\/$/, '')
  }

  if ($('#file-browser').length) {
    // startBrowsing(browsePageItems);
    startBrowsing()
  }

  $('.btn-go-to-research').on('click', function () {
    window.location.href = '/research/?dir=' + encodeURIComponent('/' + $(this).attr('research-area'))
  })

  $('.btn-go-to-group-manager').on('click', function () {
    Yoda.storage.session.set('selected-group', $(this).attr('group'))
    window.location.href = '/group_manager'
  })

  $('.btn-group button.metadata-form').on('click', function () {
    showMetadataForm($(this).attr('data-path'))
  })

  $('body').on('click', 'a.action-show-checksum-report', function () {
    const folder = $(this).attr('data-folder')
    const downloadUrl = '/browse/download_checksum_report?path=' + encodeURIComponent(folder)

    $('#showChecksumReport .collection').text(folder)
    $('#showChecksumReport .modal-body #checksumReport').html('')
    $('#showChecksumReport .modal-footer .download-report-text').attr('href', downloadUrl + '&format=text')
    $('#showChecksumReport .modal-footer .download-report-csv').attr('href', downloadUrl + '&format=csv')

    Yoda.call('research_manifest',
      { coll: Yoda.basePath + folder }).then((data) => {
      document.getElementById('number-of-files').textContent = data.files
      document.getElementById('total-size').textContent = data.size
      document.getElementById('number-of-checksums').textContent = `${data.checksums} / ${data.files}`

      let table = '<table class="table table-striped"><tbody>'

      table += '<thead><tr><th>Filename</th><th>Size</th><th>Checksum</th></tr></thead>'
      if (data.manifest.length > 0) {
        $.each(data.manifest, function (index, obj) {
          table += `<tr>
                      <td>${Yoda.htmlEncode(obj.name)}</td>
                      <td>${Yoda.htmlEncode(obj.human_readable_size)}</td>
                      <td><pre>${Yoda.htmlEncode(obj.checksum)}</pre></td>
                  </tr>`
        })
        if (downloadChecksumReportTextTooltip) {
          downloadChecksumReportTextTooltip.disable()
        }
        if (downloadChecksumReportCSVTooltip) {
          downloadChecksumReportCSVTooltip.disable()
        }
      } else {
        $('#showChecksumReport .modal-footer .download-report-text').removeAttr('href')
        $('#showChecksumReport .modal-footer .download-report-csv').removeAttr('href')
        if (downloadChecksumReportTextTooltip) {
          downloadChecksumReportTextTooltip.enable()
        }
        if (downloadChecksumReportCSVTooltip) {
          downloadChecksumReportCSVTooltip.enable()
        }
      }
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
    previousVersion = null
    $('.previousPublications').html('')
    Yoda.call('vault_get_published_packages', { path: Yoda.basePath + vault }).then((data) => {
      if (Object.keys(data).length > 0) {
        let i = 0
        $.each(data, function (doi, publication) {
          i++
          const vaultPath = publication.path.replace(Yoda.basePath, '')
          $('.previousPublications').append(`
<div class="form-check">
  <input class="form-check-input" type="radio" name="previousVersionSelect" id="previousVersion${i}" value="${Yoda.htmlEncode(publication.path)}">
  <label class="form-check-label" for="previousVersion${i}">
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

  const deaccessionActions = {
    '.btn-confirm-folder-deaccession-approve': 'approve',
    '.btn-confirm-folder-deaccession-deny': 'deny',
    'a.action-vault-cancel-deaccession': 'cancel'
  }

  document.addEventListener('click', function (event) {
    for (const [selector, action] of Object.entries(deaccessionActions)) {
      if (event.target.matches(selector)) {
        event.preventDefault()
        handleDeaccessionAction(action, currentFolder)
        break
      }
    }
  })

  // Click request button in modal
  const requestDeaccessForm = document.getElementById('deaccess-request-form')
  requestDeaccessForm.addEventListener('submit', function (event) {
    event.preventDefault()
    handleDeaccessionAction('request', currentFolder)
  })

  // Reset request deaccess modal on opening of modal.
  const deaccessModal = document.getElementById('vault-request-deaccession')
  deaccessModal.addEventListener('shown.bs.modal', function () {
    document.getElementById('deaccess-request-form').reset()
    document.getElementById('deaccess-owner-check-block').style.display = 'none'
    document.getElementById('deaccess-owner-absence-check-block').style.display = 'none'
    document.querySelectorAll('input[name="found-owner-radio"]').forEach(input => {
      input.checked = false
    })
    updateRequestButton()
  })

  // Show or hide parts of the form depending on what user clicks.
  document.getElementById('deaccess-request-form').addEventListener('change', function (event) {
    if (event.target.name === 'found-owner-radio') {
      const showOwnerCheck = event.target.id === 'found-owner-true'
      document.getElementById('deaccess-owner-check-block').style.display = showOwnerCheck ? '' : 'none'
      document.getElementById('deaccess-owner-absence-check-block').style.display = showOwnerCheck ? 'none' : ''
    }
    updateRequestButton()
  })

  // Validate request and update button.
  function updateRequestButton () {
    const reasonSelected = document.querySelector('input[name="deaccess-reason"]:checked')
    const reasonValid = reasonSelected && (reasonSelected.id !== 'reason-other' || document.getElementById('deaccess-reason-input').value.trim())

    const highValueChecked = document.getElementById('deaccess-high-value-check').checked

    const ownerFound = document.querySelector('input[name="found-owner-radio"]:checked')
    const ownerPermissionValid = ownerFound && (
      (ownerFound.id === 'found-owner-true' && document.getElementById('deaccess-owner-check').checked) ||
      (ownerFound.id === 'found-owner-false' && document.getElementById('deaccess-owner-absence-check').checked)
    )

    const isFormValid = reasonValid && highValueChecked && ownerPermissionValid
    document.querySelector('.btn-confirm-deaccession-submit').disabled = !isFormValid
  }

  // Validate deaccession reason changes.
  document.getElementById('deaccess-reason-input').addEventListener('input', updateRequestButton)

  $('body').on('click', 'button.action-confirm-data-package-select', function () {
    previousVersion = $('#submitPublication .modal-body input[type="radio"]:checked').val()
    $('#submitPublication').modal('hide')

    $('#confirmAgreementConditions .modal-body').text('') // clear it first

    // Fetch publication terms from the Flask endpoint
    $.ajax({
      url: '/admin/get_publication_terms',
      type: 'GET',
      success: function (response) {
        $('#confirmAgreementConditions .modal-body').html(response.terms)

        // Set default status and show dialog.
        $('.action-confirm-submit-for-publication').prop('disabled', true)
        $('#confirmAgreementConditions .confirm-conditions').prop('checked', false)

        $('#confirmAgreementConditions').modal('show')
      },
      error: function () {
        console.error('Failed to load publication terms.')
        // Handle error case
        $('#confirmAgreementConditions .modal-body').html('Failed to load publication terms.')
      }
    })
  })

  $('#confirmAgreementConditions').on('click', '.confirm-conditions', function () {
    if ($(this).prop('checked')) {
      $('#confirmAgreementConditions .action-confirm-submit-for-publication').prop('disabled', false)
    } else {
      $('#confirmAgreementConditions .action-confirm-submit-for-publication').prop('disabled', true)
    }
  })

  const vaultActions = {
    '.action-confirm-submit-for-publication': { action: 'submit', modal: '#confirmAgreementConditions' },
    'a.action-approve-for-publication': { action: 'approve' },
    'a.action-cancel-publication': { action: 'cancel' },
    '.action-confirm-depublish-publication': { action: 'depublish', modal: '#confirmDepublish' },
    '.action-confirm-republish-publication': { action: 'republish', modal: '#confirmRepublish' }
  }

  document.addEventListener('click', function (event) {
    for (const [selector, config] of Object.entries(vaultActions)) {
      if (event.target.matches(selector)) {
        event.preventDefault()
        handleVaultAction(config.action, event.target.dataset.folder)
        break
      }
    }
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

  $('body').on('click', 'a.action-change-vault-access', function () {
    // Show more detailed information on changing read permissions
    if (researchGroupAccess) {
      $('.action-confirm-revoke-read-permissions').attr('data-folder', $(this).attr('data-folder'))
      $('#confirmRevokeReadPermissions').modal('show')
    } else {
      $('.action-confirm-grant-read-permissions').attr('data-folder', $(this).attr('data-folder'))
      $('#confirmGrantReadPermissions').modal('show')
    }
  })

  $('#confirmRevokeReadPermissions').on('click', '.action-confirm-revoke-read-permissions', function () {
    $('#confirmRevokeReadPermissions').modal('hide')
    vaultAccess('revoke', $(this).attr('data-folder'))
  })

  $('#confirmGrantReadPermissions').on('click', '.action-confirm-grant-read-permissions', function () {
    $('#confirmGrantReadPermissions').modal('hide')
    vaultAccess('grant', $(this).attr('data-folder'))
  })

  $('body').on('click', 'a.action-depublish-publication', function () {
    // Set the current folder.
    $('.action-confirm-depublish-publication').attr('data-folder', $(this).attr('data-folder'))
    // Show depublish modal.
    $('#confirmDepublish').modal('show')
  })

  $('body').on('click', 'a.action-republish-publication', function () {
    // Set the current folder.
    $('.action-confirm-republish-publication').attr('data-folder', $(this).attr('data-folder'))
    // Show depublish modal.
    $('#confirmRepublish').modal('show')
  })

  $('#vaultDownload').on('click', '.action-confirm-vault-download', function () {
    $('#vaultDownload').modal('hide')
    vaultDownload($(this).attr('data-folder'))
  })

  $('#vaultArchival').on('click', '.action-confirm-vault-archival', function () {
    $('#vaultArchival').modal('hide')
    handleVaultArchiveAction('archive', $(this).attr('data-folder'))
  })

  $('#vaultUnarchive').on('click', '.action-confirm-vault-unarchive', function () {
    $('#vaultUnarchive').modal('hide')
    handleVaultArchiveAction('extract', $(this).attr('data-folder'))
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
})

function createTooltips () {
  const downloadChecksumReportText = $('.download-report-text').parent()
  downloadChecksumReportTextTooltip = new bootstrap.Tooltip(downloadChecksumReportText)
  downloadChecksumReportTextTooltip.disable()

  const downloadChecksumReportCSV = $('.download-report-csv').parent()
  downloadChecksumReportCSVTooltip = new bootstrap.Tooltip(downloadChecksumReportCSV)
  downloadChecksumReportCSVTooltip.disable()
}

function changeBrowserUrl (path) {
  let url = window.location.pathname
  if (typeof path !== 'undefined') {
    url += '?dir=' + encodeURIComponent(path)
  }

  window.history.pushState({}, {}, url)
}

function browse (dir = '', changeHistory = false) {
  resetMultiSelectCheckbox()
  currentFolder = dir
  // remove hide class that could have been added when a erroneous vault path was used.
  $('#file-browser_wrapper').removeClass('hide')
  handleGoToResearchButton(dir)
  handleGoToGroupManager(dir)
  makeBreadcrumb(dir)
  if (changeHistory) { changeBrowserUrl(dir) }

  // Used to initially hide Metadata info, alerts
  const pathParts = dir.split('/')
  // Do not show metadata outside data package.
  if (pathParts.length < 3) {
    $('.metadata-info').hide()
    $('.alert.is-archived').hide()
    $('.alert.is-processing').hide()
    $('.alert.is-embargoed').hide()
    const deaccessionAlert = document.querySelector('.alert.is-deaccession-complete')
    deaccessionAlert?.classList.add('hide')
  }
  // only here topInformation should show its alertMessage and rebuild the file browser
  topInformation(dir, true, true)
}

function resetMultiSelectCheckbox () {
  $('#multi-select-all').prop({ checked: false })
  $('#multiSelect').addClass('hide')
  $("input[name='multiSelect[]']").prop('checked', false)
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

function handleGoToGroupManager (dir) {
  // Handle the button with which to return to the corresponding research area.
  const parts = dir.split('/')

  if (parts.length > 1) {
    $('.btn-go-to-group-manager').attr('group', parts[1].replace('vault-', 'research-')).show()
  } else {
    $('.btn-go-to-group-manager').attr('group', '').hide()
  }
}

function determineFileIcon (name, rowType, fileType) {
  // Determine icon
  if (rowType === 'coll') {
    return 'fa-folder'
  } else if (Yoda.isTextExtension(name)) {
    return 'fa-file-lines'
  } else if (fileType) {
    switch (fileType) {
      case 'audio':
        return 'fa-file-audio'
      case 'video':
        return 'fa-file-video'
      case 'image':
        return 'fa-file-image'
    }
  } else {
    return 'fa-file'
  }
}

function determineNameHTML (name, row, tgt, fileType, icon) {
  if (row.type === 'coll') {
    return `<a class="coll browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${Yoda.htmlEncode(tgt)}"><i class="fa-regular ${icon}"></i> ${Yoda.htmlEncode(name)}</a>`
  } else if (hasReadRights && Yoda.isTextExtension(name) && row.size < 4 * 1024 * 1024) {
    return `<a href="/fileviewer?file=${encodeURIComponent(tgt)}" target="_blank" data-path="${Yoda.htmlEncode(tgt)}"><i class="fa-regular ${icon}"></i> ${Yoda.htmlEncode(name)}</a>`
  } else if (hasReadRights && fileType) {
    return `<a href="/fileviewer?file=${encodeURIComponent(tgt)}" target="_blank" data-path="${Yoda.htmlEncode(tgt)}"><i class="fa-regular ${icon}"></i> ${Yoda.htmlEncode(name)}</a>`
  } else {
    return `<i class="fa-regular ${icon}"></i> ${Yoda.htmlEncode(name)}`
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
  fileBrowser.ajax.reload(() => {
    if (currentFile) {
      jumpToDataInCache(fileBrowser, currentFile)
      currentFile = null
    }
  }, true)

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

  // Expose cache data for jumpToDataInCache
  fn.getCache = () => ({
    cache,
    cacheStart,
    cacheFolder,
    cacheSortCol,
    cacheSortOrder
  })

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
      checkbox = `<input class="form-check-input ms-1" type="checkbox" name="multiSelect[]" value="${Yoda.htmlEncode(tgt)}" data-name="${Yoda.htmlEncode(name)}" data-type="${row.type}">`
    }
    return checkbox
  },
  name: (name, _, row) => {
    const tgt = `${currentFolder}/${name}`
    const fileType = Yoda.viewableExtensionType(name)
    const icon = determineFileIcon(name, row.type, fileType)

    return determineNameHTML(name, row, tgt, fileType, icon)
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
      actions.append(`<a href="#" class="dropdown-item folder-download" data-path="${Yoda.htmlEncode(currentFolder + '/' + row.name)}" title="Download this folder">Download</a>`)
    } else {
      actions.append(`<a class="dropdown-item file-download" href="/browse/download?filepath=${encodeURIComponent(currentFolder + '/' + row.name)}" data-collection="${Yoda.htmlEncode(currentFolder)}" data-name="${Yoda.htmlEncode(row.name)}" title="Download this file">Download</a>`)
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
  $('#file-browser').DataTable({
    bFilter: false,
    bInfo: false,
    bLengthChange: true,
    language: {
      emptyTable: 'No accessible files/folders present',
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

function topInformation (dir, rebuildFileBrowser = false) {
  if (typeof dir !== 'undefined') {
    Yoda.call('vault_collection_details',
      { path: Yoda.basePath + dir },
      { quiet: true, rawResult: true }).then((dataRaw) => {
      const data = dataRaw.data
      if (dataRaw.status === 'error_nonexistent') {
        Yoda.set_message('error', 'This path is not accessible: ' + dir +
                                 '. Either it does not exist or you do not have the right permissions.')
        $('#file-browser_wrapper').addClass('hide')
        $('.top-information').addClass('hide')

        // no more action required here
        return true
      }

      let statusText = ''
      let archiveBadge = ''
      let archiveText = ''
      let todayDate = ''
      let deaccessionBadge = ''
      let actions = []
      const vaultStatus = data.status
      const vaultActionPending = data.vault_action_pending
      const hasWriteRights = 'yes'
      const userType = data.member_type
      const hasDatamanager = data.has_datamanager
      const isDatamanager = data.is_datamanager
      const isAdmin = data.is_admin
      const downloadable = data.downloadable
      const archive = data.archive
      const deaccession = data.deaccession
      researchGroupAccess = data.research_group_access
      const allVersions = data.all_versions
      const baseDOI = data.base_doi
      const packageDOI = data.package_doi
      const embargoEndDate = data.embargo_end_date
      const dataAccessRestriction = data.data_access_restriction

      const pathParts = dir.split('/')

      $('.btn-group button.metadata-form').hide()

      if (pathParts.length < 2) {
        // Hide top information and buttons when browsing at vault space level
        $('.top-information').hide()
        $('.top-info-buttons').hide()
      } else {
        // Show top information and buttons when browsing at group collection level and lower
        $('.top-information').show()
        $('.top-info-buttons').show()
      }

      if (userType !== 'none' || isDatamanager) {
        // Datamanager, Researcher, normal, groupmanager cases
        hasReadRights = true
      } else {
        // Anyone else case
        hasReadRights = false
      }

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
            if ((isDatamanager && archive.archivable) && !archive.status) {
              actions['vault-archival'] = ['Archive on tape', false]
            } else if ((isDatamanager && !archive.archivable) && !archive.status) {
              actions['vault-archival'] = ['Archive on tape', true]
            }

            $('.alert.is-archived').hide()
            if (archive.status !== false) {
              archiveText = archive.status
              if (archive.status === 'archive' || archive.status === 'archiving') {
                archiveText = 'Scheduled for archiving'
                $('.alert.is-archived').show()
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
                archiveText = 'Scheduled for unarchiving'
                $('.alert.is-archived').show()
              } else if (archive.status === 'bagit' || archive.status === 'baggingit') {
                archiveText = 'Scheduled for download'
              }
            } else if (downloadable) {
              actions['vault-download'] = 'Download as bagit'
            }
            archiveBadge = '<span id="archiveBadge" class="ms-2 badge rounded-pill bg-secondary text-white">' + archiveText + '</span>'
          } else {
            if (downloadable) {
              actions['vault-download'] = 'Download as bagit'
            }
            archiveBadge = '<span id="archiveBadge" class="ms-2 badge rounded-pill bg-secondary text-white">' + archiveText + '</span>'
          }
        }

        // Vault deaccession data package
        if (typeof deaccession !== 'undefined') {
          if (isDatamanager && deaccession.status === '') {
            if (vaultStatus === 'UNPUBLISHED' || vaultStatus === 'PUBLISHED' || vaultStatus === 'DEPUBLISHED') {
              actions['vault-request-deaccession'] = 'Request deaccession'
            }
          }

          const deaccessionAlert = document.querySelector('.alert.is-deaccession-complete')
          deaccessionAlert?.classList.add('hide')

          let deaccessionText = deaccession.status
          if (deaccession.status !== '') {
            actions = []

            if (deaccession.status === 'DEACCESSION_REQUESTED') {
              deaccessionText = 'Deaccession requested'
              if (isDatamanager || isAdmin) {
                actions['vault-cancel-deaccession'] = 'Cancel deaccession'
              }
              if (isAdmin) {
                actions['vault-approve-deaccession'] = 'Approve/deny deaccession'
              }
              document.getElementById('deaccess-reason-readonly').textContent = deaccession.reason
            } else if (deaccession.status === 'DEACCESSION_APPROVED') {
              deaccessionText = 'Deaccession approved'
            } else if (deaccession.status === 'DEACCESSION_COMPLETE') {
              deaccessionText = 'Deaccession complete'
              deaccessionAlert?.classList.remove('hide')
            }
          }
          deaccessionBadge = `<span id="deaccessionBadge" class="ms-2 badge rounded-pill bg-secondary text-white">${deaccessionText}</span>`
        }

        // Vault in progress of being created
        $('.alert.is-processing').hide()
        if (vaultStatus === '' || vaultStatus === 'INCOMPLETE') {
          $('.alert.is-processing').show()
        } else {
          if (hasReadRights) {
            metadataInfo(dir)
          } else {
            $('.metadata-info').show()
            $('.metadata-title').text(dir)
            $('.metadata-description').text('N/A')
            $('.metadata-access').text('N/A')
            $('.metadata-data-classification').text('N/A')
            $('.metadata-license').text('N/A')
          }
          if (vaultStatus === 'PUBLISHED' || vaultStatus === 'PENDING_DEPUBLICATION' || vaultStatus === 'PENDING_REPUBLICATION' || vaultStatus === 'DEPUBLISHED') {
            $('.metadata-form-size').addClass('col-lg-8')
            $('.meta-title-size').removeClass('col-lg-2').addClass('col-lg-3')
            $('.meta-content-size').removeClass('col-lg-10').addClass('col-lg-9')

            // List DOIs
            const listDOIs = $('.version tbody')
            const baseDOISpan = $('.base_doi span')
            let ld = ''
            let highlight = ''
            let bdoi = ''
            for (let i = 0; i < allVersions.length; i++) {
              if (packageDOI === allVersions[i][1] && allVersions.length > 1) {
                highlight = ' class="highlight"'
              } else {
                highlight = ''
              }

              ld += '<tr' + highlight + '><td>' +
              '<a href="https://doi.org/' + allVersions[i][1] + '">https://doi.org/' + allVersions[i][1] + '</a>' +
              '</td><td>' +
              '<small title="' + allVersions[i][2] + '">' + allVersions[i][0] + '</small>' +
              '</td></tr>'
            }
            listDOIs.html(ld)
            if (baseDOI != null) {
              bdoi += '<a href="https://doi.org/' + baseDOI + '">https://doi.org/' + baseDOI + '</a><br>'
              baseDOISpan.html(bdoi)
              $('.base_doi').show()
            } else {
              $('.base_doi').hide()
            }
            $('.version').show()
          } else {
            $('.metadata-form-size').removeClass('col-lg-8')
            $('.meta-title-size').removeClass('col-lg-3').addClass('col-lg-2')
            $('.meta-content-size').removeClass('col-lg-9').addClass('col-lg-10')
            $('.version').hide()
          }
        }

        // Embargo end date
        todayDate = (new Date()).toISOString().slice(0, 10)

        if (embargoEndDate !== '' && (todayDate < embargoEndDate) && dataAccessRestriction === 'Open - freely retrievable') {
          $('.alert.is-embargoed').html('This data package is embargoed until ' + embargoEndDate + '.')
          $('.alert.is-embargoed').show()
        }

        // Datamanager sees access buttons in vault.
        $('.top-info-buttons').show()
        if (isDatamanager) {
          actions['change-vault-access'] = 'Change who has read access'
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

      // Show top information and buttons.
      if (typeof vaultStatus !== 'undefined') {
        // Arrange folder buttons of data package
        $('.top-information h2').html(`${statusBadge}${archiveBadge}${deaccessionBadge}${systemMetadataIcon}${actionLogIcon}`)

        $('.top-information').show()
        $('.top-info-buttons').show()

        // Trigger tooltips.
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]:not(.download-report-text):not(.download-report-csv)')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl)) // eslint-disable-line no-unused-vars
      } else {
        // Clear folder buttons when not browsing a data package
        $('.top-information h2').html('')
      }

      if (rebuildFileBrowser) {
        buildFileBrowser(dir)
      }
    })
  } else {
    $('.top-information').hide()
  }
}

function handleActionsList (actions, folder) {
  const possibleActions = [
    'submit-for-publication', 'cancel-publication',
    'approve-for-publication', 'depublish-publication',
    'republish-publication', 'vault-download',
    'vault-archival', 'vault-unarchive',
    'vault-request-deaccession', 'vault-approve-deaccession', 'vault-cancel-deaccession'
  ]

  const possibleModalActions = [
    'vault-request-deaccession', 'vault-approve-deaccession'
  ]

  const possibleVaultActions = [
    'change-vault-access', 'copy-vault-package-to-research',
    'check-for-unpreservable-files', 'show-checksum-report'
  ]

  function buildLinks (keys) {
    let html = ''
    keys.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(actions, key)) return

      const item = actions[key]
      let text; let isDisabled = false

      if (Array.isArray(item)) {
        text = item[0]
        isDisabled = Boolean(item[1])
      } else {
        text = item
      }

      if (possibleModalActions.includes(key)) {
        html += `<a class="dropdown-item action-${key}${(isDisabled ? ' disabled' : '')}" data-folder="${Yoda.htmlEncode(folder)}" data-bs-toggle="modal" data-bs-target="#${key}">
          ${Yoda.htmlEncode(text)}</a>`
      } else {
        html += `<a class="dropdown-item action-${key}${(isDisabled ? ' disabled' : '')}" data-folder="${Yoda.htmlEncode(folder)}">
          ${Yoda.htmlEncode(text)}</a>`
      }
    })
    return html
  }

  const htmlMain = buildLinks(possibleActions)
  const htmlVault = buildLinks(possibleVaultActions)

  let finalHtml = htmlMain
  if (htmlMain && htmlVault) {
    finalHtml += '<div class="dropdown-divider"></div>' + htmlVault
  } else if (htmlVault) {
    finalHtml = htmlVault
  }

  $('.action-list').html(finalHtml)
}

function showMetadataForm (path) {
  window.location.href = 'metadata/form?path=' + encodeURIComponent(path)
}

async function handleVaultAction (action, folder) {
  const actionLabels = {
    submit: { label: 'Submit for publication', status: 'Submitted for publication' },
    approve: { label: 'Approve for publication', status: 'Approved for publication' },
    cancel: { label: 'Cancel publication', status: 'Unpublished' },
    depublish: { label: 'Depublish publication', status: 'Depublication pending' },
    republish: { label: 'Republish publication', status: 'Republication pending' }
  }

  const badge = document.getElementById('statusBadge')
  const badgeText = badge.innerHTML
  const label = actionLabels[action].label
  const status = actionLabels[action].status
  const spinner = '<i class="fa-solid fa-spinner fa-spin fa-fw"></i>'

  badge.innerHTML = `${label} ${spinner}`

  // Disable all buttons in .btn-group with class .folder-status and their next siblings
  const folderStatusButtons = document.querySelectorAll('.btn-group button.folder-status')
  folderStatusButtons.forEach(button => {
    button.disabled = true
    const nextButton = button.nextElementSibling
    if (nextButton) {
      nextButton.disabled = true
    }
  })

  try {
    const params = { coll: Yoda.basePath + folder }
    if (action === 'submit' && previousVersion) {
      params.previous_version = previousVersion
    }
    await Yoda.call(`vault_${action}`, params)
    badge.innerHTML = `${status}`
  } catch (e) {
    badge.innerHTML = `${badgeText}`
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

async function handleVaultArchiveAction (action, folder) {
  const actionLabels = {
    archive: { label: 'Schedule for archiving', status: 'Scheduled for archiving' },
    extract: { label: 'Schedule for unarchiving', status: 'Scheduled for unarchiving' }
  }

  const badge = document.getElementById('archiveBadge')
  const badgeText = badge.innerHTML
  const actionConfig = actionLabels[action]
  const label = actionConfig.label
  const status = actionConfig.status
  const spinner = '<i class="fa-solid fa-spinner fa-spin fa-fw"></i>'

  badge.innerHTML = `${label} ${spinner}`

  try {
    const params = { coll: Yoda.basePath + folder }
    await Yoda.call(`vault_${action}`, params)
    badge.innerHTML = `${status}`
  } catch (e) {
    badge.innerHTML = `${badgeText}`
  }
  topInformation(folder, false)
}

async function handleDeaccessionAction (action, folder) {
  const actionLabels = {
    request: 'Request deaccession',
    approve: 'Approve deaccession',
    cancel: 'Cancel deaccession',
    deny: 'Cancel deaccession'
  }

  const modalActionsModals = {
    approve: 'approve',
    deny: 'approve',
    request: 'request'
  }

  const actionCalls = {
    request: 'request',
    approve: 'approve',
    cancel: 'cancel',
    deny: 'cancel'
  }

  const $badge = $('#deaccessionBadge')
  const label = actionLabels[action]
  const spinner = '<i class="fa-solid fa-spinner fa-spin fa-fw"></i>'

  $badge.html(`${label} ${spinner}`).removeClass('hide')

  // If button was in modal, hide modal
  if (action in modalActionsModals) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(`vault-${modalActionsModals[action]}-deaccession`))
    modal.hide()
  }

  const params = { coll: Yoda.basePath + folder }
  if (action === 'request') {
    const selected = document.querySelector('input[name="deaccess-reason"]:checked')
    params.reason = selected?.id === 'reason-other' ? document.getElementById('deaccess-reason-input').value : 'End of retention period'
  }

  const result = await Yoda.call(`vault_${actionCalls[action]}_deaccession`,
    params,
    { quiet: true, rawResult: true }
  )

  if (result.status === 'ok') {
    topInformation(folder, false)
    if (action === 'approve') {
      browse(currentFolder)
    }
  } else {
    if (result.status_info) {
      Yoda.set_message('error', result.status_info)
    } else {
      Yoda.set_message('error', `Failed to ${action} deaccession of data package`)
    }
    $badge.hide()
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
        if (!result || !result.data || Object.keys(result.data).length === 0) { return console.info('No result data from meta_form_load') }

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

function jumpToDataInCache (table, fileName) {
  const cacheInfo = getFolderContents.getCache()

  // Validate cache
  if (cacheInfo.cacheFolder !== currentFolder ||
      cacheInfo.cacheSortCol !== table.order()[0][0] ||
      cacheInfo.cacheSortOrder !== table.order()[0][1]) {
    table.ajax.reload()
    return
  }

  // Search file from cached items
  const pos = cacheInfo.cache.findIndex(item => item.name === fileName)

  if (pos >= 0) {
    const globalPos = cacheInfo.cacheStart + pos
    const page = Math.floor(globalPos / table.page.info().length)
    table.page(page).draw(false)
  }
}
