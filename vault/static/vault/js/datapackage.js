/* global browseStartDir, dpReference, dpIsRestricted, L */
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
let bounds = [[1, 1][1, 1]]
let mymap = null
let maplayer = null

let metadata // Make it global so functions on different levels can access it without having to pass it as a parameter entirely
// mfunction contains specific presentation functions that are initiated from the template on the base of dpAttr (datapackage attribute)
const mfunction = {}

mfunction.Tag = function (a) {
  if (a) {
    return a.join(', ')
  }
  return ''
}

mfunction.Retention_Period = function (retentionPeriod) {
  if (retentionPeriod && metadata.deposit_date) {
    const endDate = new Date(metadata.deposit_date)
    const retPer = parseInt(retentionPeriod)
    // Determine end date by adding retention period to the deposit date
    endDate.setFullYear(endDate.getFullYear() + retPer)
    return endDate.toJSON().substring(0, 10) + ' (' + retPer.toString() + ' years)'
  }
  return ''
}

mfunction.Collected = function (Collected) {
  if (Collected) {
    return metadata.Collected.Start_Date + ' - ' + metadata.Collected.End_Date
  }
  return ''
}

// Contact person is placed within Contributor in yoda-metadata.json. There's Only 1
mfunction.Contributor = function (Contributor) {
  const contributors = []
  for (const c in Contributor) {
    const fullname = ''.concat(Contributor[c].Name.Given_Name, ' ', Contributor[c].Name.Family_Name)
    contributors.push(fullname)
  }
  return contributors.join(', ')
}

mfunction.Creator = function (Creator) {
  const owners = []
  for (const c in Creator) {
    let fullname = ''.concat(Creator[c].Name.Given_Name, ' ', Creator[c].Name.Family_Name)
    fullname += ', ' + Creator[c].Affiliation + ', ' + Creator[c].Owner_Role
    owners.push(fullname)
  }
  return owners.join(', ')
}

mfunction.Related_Datapackage = function (relatedDatapackage) {
  const references = []
  for (const c in relatedDatapackage) {
    const ref = relatedDatapackage[c]
    if (ref.Title !== undefined) {
      const scheme = ref.Persistent_Identifier.Identifier_Scheme
      const identifier = ref.Persistent_Identifier.Identifier
      let row = '<tr><td style="width:300px;">' + ref.Title + '</td>'
      let link = ''

      if (identifier !== undefined) {
        if (identifier.startsWith('https://')) {
          row += '<td><a href="' + identifier + '">' + identifier + '</a></td></tr>'
        } else if (identifier.startsWith('http://')) {
          row += '<td><a href="' + identifier + '">' + identifier + '</a></td></tr>'
        } else if (scheme === 'DOI') {
          link = 'https://doi.org/' + identifier
          row += '<td><a href="' + link + '">' + link + '</a></td></tr>'
        } else if (scheme === 'Handle') {
          link = 'https://hdl.handle.net/' + identifier
          row += '<td><a href="' + link + '">' + link + '</a></td></tr>'
        } else {
          row += '<td>' + identifier + '</td>'
        }
      }

      row += '</tr>'
      references.push(row)
    }
  }
  if (references.length) {
    return '<table>' + references.join('') + '</table>'
  }
  return ''
}

mfunction.GeoLocation = function (GeoLocation) {
  const geolocations = []
  for (const c in GeoLocation) {
    const loc = GeoLocation[c]
    let emptyRow = true
    let row = ''
    if (loc.Description_Spatial !== undefined) {
      row += '<tr><td style="width:200px;">' + loc.Description_Spatial + '</td>'
      emptyRow = false
    }

    if (Object.entries(loc.geoLocationBox).length !== 0) {
      row += '<td><button class="btn btn-outline-secondary btn-sm show-map"'
      row += ' data-lon0="' + loc.geoLocationBox.eastBoundLongitude.toString() + '"'
      row += ' data-lat0="' + loc.geoLocationBox.northBoundLatitude.toString() + '"'
      row += ' data-lon1="' + loc.geoLocationBox.westBoundLongitude.toString() + '"'
      row += ' data-lat1="' + loc.geoLocationBox.southBoundLatitude.toString() + '"'
      row += ' data-spatial="' + loc.Description_Spatial + '"'
      row += '><i class="fa fa-map"></i> Show map</button></td>'
      emptyRow = false
    }
    row += '</tr>'

    if (!emptyRow) {
      geolocations.push(row)
    }
  }
  if (geolocations.length) {
    return '<table>' + geolocations.join('') + '</table>'
  }
  return ''
}

$(function () {
  // Extract current location from query string (default to '').
  // Only do this with an open package
  if (!dpIsRestricted) {
    currentFolder = decodeURIComponent((/(?:\?|&)dir=([^&]*)/
      .exec(window.location.search) || [0, ''])[1])

    currentFolder = browseStartDir
    // Canonicalize path somewhat, for convenience.
    currentFolder = currentFolder.replace(/\/+/g, '/').replace(/\/$/, '')
  }

  $('.btn-copy-to-clipboard').click(function () {
    textToClipboard($('.metadata-identifier').text())
    Yoda.set_message('success', 'DAG permalink identifier has been copied to the clipboard')
  })

  mymap = L.map('map1').fitBounds([[51.505, -0.09], [51.505, -0.09]], { maxZoom: 5 })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(mymap)

  // Trick to make leaflet work within a bootstrap modal
  $('#viewMap').on('shown.bs.modal', function () {
    setTimeout(function () {
      mymap.invalidateSize()
      // When presenting a point set the zoom factor differently as to give more direct context
      if (bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1]) {
        mymap.fitBounds(bounds, { maxZoom: 4 })
      } else {
        mymap.fitBounds(bounds, { maxZoom: 8 })
      }
    }, 10)
  })

  if (dpIsRestricted) {
    handleRestrictedMetadataInfo()
  } else {
    // First collect the information, then present it
    handleOpenMetadataInfo(currentFolder)
  }
})

async function handleRestrictedMetadataInfo () {
  /* Collect and present restricted datapackage metadata through the search api based upon a uuid of 1 single datapackage. */
  const data = {}
  data.uuid = dpReference
  const formData = new FormData()
  formData.append(Yoda.csrf.tokenName, Yoda.csrf.tokenValue)
  formData.append('data', JSON.stringify(data))

  try {
    const r = await fetch('/open_search/metadata', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })

    const j = await r.json()

    metadata = j.metadata
    // bring separately delivered deposit_date into the metadata dict for ease of reference
    metadata.deposit_date = j.deposit_date
    // Correct Personal data values derived from Data_Classification
    metadata.Data_Classification = convertClassificationToPersonal(metadata.Data_Classification)

    // Show the collected metadata
    metadataShow()
  } catch (error) {
    // Network failure / abort.
    console.error(`API Error: ${error}`)
    return errorResult('Your request could not be completed due to a network connection issue.' +
                ' Please try again in a few minutes.')
  }
}

function handleOpenMetadataInfo (dir) {
  /* Collect and present OPEN datapackage metadata through the irods-api based upon a collection */
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
    Yoda.call('vault_get_landingpage_data',
      { coll: Yoda.basePath + dir },
      { rawResult: true })
      .then((result) => {
        if (!result || Object.keys(result.data).length === 0) { return console.info('No result data from meta_form_load') }

        metadata = result.data.metadata
        // bring separately delivered deposit_date into the metadata dict for ease of reference
        metadata.deposit_date = result.data.deposit_date
        // Correct Personal data values derived from Data_Classification
        metadata.Data_Classification = convertClassificationToPersonal(metadata.Data_Classification)

        // Show the collected metadata
        metadataShow()
      })
  } catch (error) {
    console.error(error)
  }
}

function convertClassificationToPersonal (classification) {
  if (classification === 'Basic') {
    return 'No'
  }
  return 'Yes'
}

function metadataShow () {
  /* Shows the collected metadata (either open or restricted) */
  // Creator, Title and Description are 3 fields that are always present.
  const creators = []
  for (const c in metadata.Creator) {
    let fullname = ''.concat(metadata.Creator[c].Name.Given_Name, ' ', metadata.Creator[c].Name.Family_Name)
    fullname += ' (' + metadata.Creator[c].Owner_Role + ')'
    creators.push(fullname)
  }
  $('.metadata-creator').text(creators.join(', '))

  $('.metadata-title').text(metadata.Title)

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

  if (metadata.Data_Access_Restriction === 'Open - freely retrievable') {
    $('.metadata-access').html('<span class="badge rounded-pill bg-success mt-2 me-2 float-end"><i class="fa-solid fa-lock-open"></i> Open</span>')
  } else {
    $('.metadata-access').html('<span class="badge rounded-pill bg-warning mt-2 me-2 float-end"><i class="fa-solid fa-lock"></i> Restricted</span>')
  }

  // Step through all rows each containing fields with class 'metadata'.
  // Only present the row when there is data. Otherwise, keep the row hidden.
  $('.metadata').each(function () {
    const dpAttr = $(this).data('dp-attr')

    const data = metadata[dpAttr]
    const func = mfunction[dpAttr]
    let result = ''

    if (func) {
      result = func(data)
    } else if (data) {
      result = data
    }

    if (result.length > 0) {
      if (result.startsWith('<table>')) {
        $(this).html(result)
      } else {
        $(this).text(result)
      }
      // Only show row when data is present
      $(this).closest('.row').removeClass('hidden')
    }
  })

  $('.show-map').click(function () {
    const lon0 = parseFloat($(this).data('lon0'))
    const lat0 = parseFloat($(this).data('lat0'))
    const lon1 = parseFloat($(this).data('lon1'))
    const lat1 = parseFloat($(this).data('lat1'))
    const descrSpatial = $(this).data('spatial')

    $('.modal-map-title').html(descrSpatial)

    bounds = [[lat0, lon0], [lat1, lon1]]

    if (maplayer) {
      mymap.removeLayer(maplayer)
    }
    if (lat0 === lat1 && lon0 === lon1) {
      maplayer = L.marker([lat0, lon0]).addTo(mymap)
    } else {
      maplayer = L.rectangle([[lat0, lon0], [lat1, lon1]]).addTo(mymap)
    }
    $('#viewMap').modal('show')
  })

  $('.btn-copy-as-new-deposit').click(function () {
    $('#confirmCopyAsNewDeposit').modal('show')
  })

  $('.action-confirm-copy-as-new-deposit').click(function () {
    Yoda.call('deposit_copy_data_package',
      { reference: $(this).attr('data-yoda-reference') },
      { rawResult: true })
      .then((result) => {
        if (!result || Object.keys(result.data).length === 0) {
          $('.dlg-deposit-copy-result').html('Something went wrong trying to copy this data package as a new deposit')
          return console.info('Something went wrong trying to copy this data package as a new deposit')
        }
        // Successful initiation of copying process. Inform user and set button status to disabled.
        $('.action-confirm-copy-as-new-deposit').prop('disabled', true)
        $('.dlg-deposit-copy-text').html('The package is being copied as a new deposit.<br><br>Please be aware that it can take some time before this fully complete.')
        $('.dlg-deposit-copy-result').html('<a class="btn btn-primary ms-2" href="/deposit/data?dir=%2F' + encodeURIComponent(result.data.data) + '">Go to deposit</a>')
      })
  })
}

function truncate (str, numberOfWords) {
  // Truncate string on n number of words
  return str.split(' ').splice(0, numberOfWords).join(' ')
}

function textToClipboard (text) {
  const dummy = document.createElement('textarea')
  document.body.appendChild(dummy)
  dummy.value = text
  dummy.select()
  document.execCommand('copy')
  document.body.removeChild(dummy)
}
