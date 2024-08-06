'use strict'

$(document).ajaxSend(function (e, request, settings) {
  // Append a CSRF token to all AJAX POST requests.
  if (settings.type === 'POST' && settings.data.length) {
    settings.data +=
             '&' + encodeURIComponent(Yoda.csrf.tokenName) +
              '=' + encodeURIComponent(Yoda.csrf.tokenValue)
  }
})

let depositGroups = []

$(function () {
  if ($('#file-browser').length) {
    startBrowsing()
  }

  handleNewDepositModal()

  // FOLDER delete
  $('body').on('click', 'a.deposit-delete', function () {
    fileMgmtDialogAlert('deposit-delete', '')

    // set initial values for further processing and user experience
    $('#deposit-delete-name').text($(this).attr('data-name'))
    $('.btn-confirm-deposit-delete').attr('data-collection', $(this).attr('data-collection'))
    $('.btn-confirm-deposit-delete').attr('data-name', $(this).attr('data-name'))

    $('#deposit-delete').modal('show')
  })

  $('.btn-confirm-deposit-delete').on('click', function () {
    handleFolderDelete($(this).attr('data-collection'), $(this).attr('data-name'))
  })

  // By default, this button should be a link
  $('#deposit-create-start').on('click', function () {
    handleNewDepositModal()
    if (depositGroups.length > 1) {
      $('#deposit-create').modal('show')
    }
  })

  // Let user select which deposit group the deposit will be associated with
  $('body').on('click', '.btn-confirm-deposit-create', function () {
    const depositGroup = $('#deposit-create .modal-body input[type="radio"]:checked').val()
    $('.btn-confirm-deposit-create').prop('href', 'data?group=' + Yoda.htmlEncode(depositGroup))
  })
})

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

async function handleNewDepositModal () {
  const result = await Yoda.call('group_data', {}, { rawResult: true })

  if (result.status === 'ok') {
    const data = result.data.group_hierarchy
    const groups = []
    // Select the groups that are deposit groups
    for (const categoryName in data) {
      for (const subcategoryName in data[categoryName]) {
        for (const groupName in data[categoryName][subcategoryName]) {
          if (groupName.startsWith('deposit-')) {
            groups.push(groupName)
          }
        }
      }
    }

    let modalHTML = ''
    $.each(groups, function (index, group) {
      if (index === 0) {
        // First entry is by default checked
        modalHTML += `<div class="form-check"><input class="form-check-input" type="radio" name="radio-deposit-groups" value="${group}" id="radio-${group}" checked> <label class="form-check-label" for="radio-${group}">${group}</label></div>`
      } else {
        modalHTML += `<div class="form-check"><input class="form-check-input" type="radio" name="radio-deposit-groups" value="${group}" id="radio-${group}"> <label class="form-check-label" for="radio-${group}">${group}</label></div>`
      }
    })
    $('#radio-button-deposit-groups').html(modalHTML)
    depositGroups = groups

    if (groups.length === 1) {
      // Set the button to create a group as a link if there is only one group
      $('#deposit-create-start').prop('href', 'data?group=' + Yoda.htmlEncode(groups[0])).removeClass('disabled')
    } else if (groups.length === 0) {
      // Disable create button if no deposit groups
      $('#deposit-create-start').removeAttr('href').addClass('disabled')
      $('#deposit-create-start').prop('aria-disabled', 'true')
    }
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
    Yoda.set_message('success', 'Successfully deleted deposit ' + folderName)
    buildFileBrowser()
    $('#deposit-delete').modal('hide')
  } else {
    fileMgmtDialogAlert('deposit-delete', result.status_info)
  }
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
  let cacheSortCol = null // Cached sort column nr.
  let cacheSortOrder = null // Cached sort order.
  let i = 0 // Keep simultaneous requests from interfering.

  const get = async (args) => {
    // Check if we can use the cache.
    if (cache.length &&
         args.order[0].dir === cacheSortOrder &&
         args.order[0].column === cacheSortCol &&
         args.start >= cacheStart &&
         args.start + args.length <= cacheStart + batchSize) {
      return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length)
    } else {
      // Nope, load new data via the API.
      const j = ++i
      const result = await Yoda.call('deposit_overview',
        {
          offset: args.start,
          limit: batchSize,
          sort_order: args.order[0].dir,
          sort_on: ['name', 'size', 'modified'][args.order[0].column],
          space: 'Space.DEPOSIT'
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
      cacheSortCol = args.order[0].column
      cacheSortOrder = args.order[0].dir

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

// Functions for rendering table cells, per column.
const tableRenderer = {
  name: (name, _, row) => {
    return `<a class="coll browse" href="/deposit/data?dir=${encodeURIComponent(row.path)}" data-path="${Yoda.htmlEncode(row.path)}"><i class="fa-regular fa-folder"></i> ${Yoda.htmlEncode(name)}</a>`
  },
  title: (name, _, row) => {
    return `<a class="coll browse" href="/deposit/data?dir=${encodeURIComponent(row.path)}" data-path="${Yoda.htmlEncode(row.path)}">${Yoda.htmlEncode(row.deposit_title)}</a>`
  },
  access: (name, _, row) => {
    return `${Yoda.htmlEncode(row.deposit_access)}`
  },
  size: (depositSize, _, row) => {
    const szs = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']
    let szi = 0
    while (row.deposit_size >= 1024 && szi < szs.length - 1) {
      row.deposit_size /= 1024
      szi++
    }
    return (Math.floor(row.deposit_size * 10) / 10 + '') + '&nbsp;' + szs[szi]
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
    const actions = $('<span>')

    const pathSplit = row.path.split('/')
    if (pathSplit.length > 1) {
      actions.append(`<a href="#" class="deposit-delete" data-collection="${Yoda.htmlEncode('/' + pathSplit[1])}" data-name="${Yoda.htmlEncode(row.name)}" title="Delete this deposit"><i class="fa-solid fa-trash"></a>`)
      return actions[0].innerHTML
    }
  }
}

function startBrowsing () {
  $('#file-browser').DataTable({
    bFilter: false,
    bInfo: false,
    bLengthChange: false,
    language: {
      emptyTable: 'You have no active deposits, start a new deposit!',
      lengthMenu: '_MENU_'
    },
    dom: '<"top">frt<"bottom"lp><"clear">',
    columns: [{ render: tableRenderer.name, orderable: true, data: 'name' },
      { render: tableRenderer.title, orderable: false, data: 'name' },
      { render: tableRenderer.access, orderable: false, data: 'name' },
      // Size and date should be orderable, but limitations
      // on how queries work prevent us from doing this
      // correctly without significant overhead.
      // (enabling this as is may result in duplicated results for data objects)
      { render: tableRenderer.size, orderable: false, data: 'size' },
      { render: tableRenderer.date, orderable: true, data: 'modify_time' },
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
  buildFileBrowser()
}
