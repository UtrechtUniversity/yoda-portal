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
  // Extract current location from query string (default to '').
  currentFolder = decodeURIComponent((/(?:\?|&)dir=([^&]*)/
    .exec(window.location.search) || [0, ''])[1])

  // Canonicalize path somewhat, for convenience.
  currentFolder = currentFolder.replace(/\/+/g, '/').replace(/\/$/, '')

  if ($('#file-browser').length) {
    startBrowsing()
  }

  $('.btn-group button.metadata-form').click(function () {
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

  $('body').on('click', 'i.actionlog-icon', function () {
    toggleActionLogList($(this).attr('data-folder'))
  })

  $('body').on('click', 'i.system-metadata-icon', function () {
    toggleSystemMetadata($(this).attr('data-folder'))
  })

  $('body').on('click', '.browse', function (e) {
    browse($(this).attr('data-path'), true)
    // Dismiss stale messages.
    $('#messages .close').click()
    e.preventDefault()
  })
})

function browse (dir = '', changeHistory = false) {
  currentFolder = dir
  makeBreadcrumb(dir)
  metadataInfo(dir)
  topInformation(dir, true) // only here topInformation should show its alertMessage
  buildFileBrowser(dir)
}

function makeBreadcrumb (dir) {
  const pathParts = dir.split('/').filter(x => x.length)

  // [[Crumb text, Path]] - e.g. [...['x', '/research-a/x']]
  const crumbs = [['Vault', ''],
    ...Array.from(pathParts.entries())
      .map(([i, x]) => [x, '/' + pathParts.slice(0, i + 1).join('/')])]

  let html = ''
  for (let [i, [text, path]] of crumbs.entries()) {
    if (i > 1) {
      const el = $('<li class="breadcrumb-item">')
      if (i === 2) {
        text = 'DAG Datapackage'
      }
      text = Yoda.htmlEncode(text).replace(/ /g, '&nbsp;')
      if (i === crumbs.length - 1) { el.addClass('active').html(text) } else {
        el.html(`<a class="browse" data-path="${Yoda.htmlEncode(path)}"
                             href="?dir=${encodeURIComponent(path)}">${text}</a>`)
      }

      html += el[0].outerHTML
    }
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
  context: (_, __, row) => {
    const actions = $('<span>')

    if (row.type === 'coll') { return '' }

    // Render context menu for files.
    const viewExts = {
      image: ['jpg', 'jpeg', 'gif', 'png', 'webp'],
      audio: ['aac', 'flac', 'mp3', 'ogg', 'wav'],
      video: ['mp4', 'ogg', 'webm']
    }
    const ext = row.name.replace(/.*\./, '').toLowerCase()

    actions.append(`<a href="browse/download?filepath=${encodeURIComponent(currentFolder + '/' + row.name)}" title="Download this file"><i class="fa-solid fa-download"></a>`)

    // Generate dropdown "view" actions for different media types.
    for (const type of Object.keys(viewExts).filter(type => (viewExts[type].includes(ext)))) {
      actions.append(`<a class="dropdown-item view-${type}" data-path="${Yoda.htmlEncode(currentFolder + '/' + row.name)}" title="View this file"><i class="fa-solid fa-eye"></a>`)
    }

    return actions[0].innerHTML
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
    columns: [{ render: tableRenderer.name, data: 'name' },
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

function topInformation (dir, showAlert) {
  if (typeof dir !== 'undefined') {
    Yoda.call('vault_collection_details',
      { path: Yoda.basePath + dir }).then((data) => {
      const vaultStatus = data.status
      const vaultActionPending = data.vault_action_pending
      const hasWriteRights = 'yes'
      const isDatamanager = data.is_datamanager
      const actions = []

      $('.btn-group button.metadata-form').hide()
      $('.top-information').hide()
      $('.top-info-buttons').hide()

      // is vault package
      if (typeof vaultStatus !== 'undefined') {
        actions['copy-vault-package-to-research'] = 'Copy datapackage to research space'

        // folder status (vault folder)
        if (typeof vaultStatus !== 'undefined' && typeof vaultActionPending !== 'undefined') {
          $('.btn-group button.folder-status').attr('data-datamanager', isDatamanager)

          // Show metadata button.
          $('.btn-group button.metadata-form').attr('data-path', dir)
          $('.btn-group button.metadata-form').show()
        }
      }

      // Provenance action log
      $('.actionlog').hide()
      const actionLogIcon = ` <i class="fa-solid fa-book actionlog-icon" data-folder="${Yoda.htmlEncode(dir)}" aria-hidden="true" title="Show provenance information"></i>`

      // System metadata.
      $('.system-metadata').hide()
      const systemMetadataIcon = ` <i class="fa-solid fa-info-circle system-metadata-icon" data-folder="${Yoda.htmlEncode(dir)}" aria-hidden="true" title="Show system metadata"></i>`

      $('.btn-group button.folder-status').attr('data-write', hasWriteRights)

      // Folder buttons
      $('.top-information h2').html(`${systemMetadataIcon}${actionLogIcon}`)

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

function showMetadataForm (path) {
  window.location.href = 'metadata/form?path=' + encodeURIComponent(path)
}

function metadataInfo (dir) {
  /* Loads metadata of the vault packages */
  const pathParts = dir.split('/')

  // Do not show metadata outside data package.
  if (pathParts.length < 3) {
    $('.metadata-info').hide()
    return
  } else {
    pathParts.length = 3
    dir = pathParts.join('/')
  }

  try {
    Yoda.call('meta_form_load',
      { coll: Yoda.basePath + dir },
      { rawResult: true })
      .then((result) => {
        if (!result || Object.keys(result.data).length === 0) { return console.info('No result data from meta_form_load') }

        const metadata = result.data.metadata
        $('.metadata-info').show()
        $('.metadata-title').text(metadata.Title)
        $('.metadata-access').text(metadata.Data_Access_Restriction)
        // Translate data classification to values Yes/No (reference to datapackage containing personal data)
        $('.metadata-data-classification').text(((metadata.Data_Classification) === 'Basic' ? 'No' : 'Yes'))

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
