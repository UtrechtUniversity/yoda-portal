/* global Chart */
'use strict'

$(document).ready(function () {
  if ($('#group-browser').length) {
    startBrowsing()
  }

  $('#search-group-table').on('keyup', function () {
    $('#group-browser').DataTable().search($('#search-group-table').val()).draw()
  })

  $('#startdate_min').on('click', function () {
    $('#startdate').val(chartDateLabels[0])
    chartFilterDate()
  })
  $('#enddate_max').on('click', function () {
    $('#enddate').val(chartDateLabels[chartDateLabels.length - 1])
    chartFilterDate()
  })
})

// CHART DATA VARIABLES
// Dataset labels - this order is essential
const chartDatasetLabels = ['Research', 'Vault', 'Revisions', 'Total']
// Labels on the x-axis -> dates
const chartDateLabels = []

// 4 dimensional array holding all data for research, vault, revisions and total
let chartDatapoints = [[], [], [], []]

let chart

// Representation of visibilty of each dataset (research, vault, revisions)
let chartVisibilityStatus = [true, true, true]

// Handling of new chart
function getGroupDetails (group) {
  // when data is present show chart including the date buttons and legend.
  Yoda.call('resource_full_year_differentiated_group_storage',
    { group_name: group }).then((data) => {
    // Labels on the x-axis -> dates
    const chartDateLabels = data.labels

    // 4 dimensional array holding all data for research, vault, revisions and total
    let nrOfPoints = 0
    const chartTotals = []
    const totals = []
    while (nrOfPoints < data.research.length) {
      chartTotals[nrOfPoints] = data.research[nrOfPoints] + data.vault[nrOfPoints] + data.revision[nrOfPoints]
      totals[nrOfPoints] = data.total[nrOfPoints]
      nrOfPoints++
    }
    if (group.startsWith('grp') || group.startsWith('intake')) {
      chartDatapoints = [data.research, data.vault, data.revision, data.total]
    } else {
      chartDatapoints = [data.research, data.vault, data.revision, chartTotals]
    }

    if (nrOfPoints > 0) {
      // Take over the min/max date range based upon the actual dataset minimum and maximum.
      document.getElementById('startdate').value = chartDateLabels[0]
      document.getElementById('enddate').value = chartDateLabels[nrOfPoints - 1]

      // Set chart the buttons to the initial text again.
      document.getElementById('legend-' + chartDatasetLabels[0].toLowerCase()).innerHTML = chartDatasetLabels[0]
      document.getElementById('legend-' + chartDatasetLabels[1].toLowerCase()).innerHTML = chartDatasetLabels[1]
      document.getElementById('legend-' + chartDatasetLabels[2].toLowerCase()).innerHTML = chartDatasetLabels[2]

      // Reset the representation of visibilty of each dataset (research, vault, revisions).
      chartVisibilityStatus = [true, true, true]

      // Make chart visible and hide messaging part.
      $('#storage-chart').removeClass('hidden')
      $('#storage-chart-message').addClass('hidden')

      chartShow(group) // Create or update of chart.
    } else {
      $('#storage-chart-message').html('<p>No storage information found.</p>')
      $('#storage-chart').addClass('hidden')
      $('#storage-chart-message').removeClass('hidden')
    }
  })
}

function chartShow (group) {
  let chartData = {}
  if (chart) {
    chart.config.data.labels = chartDateLabels
    chart.config.data.datasets[0].data = chartDatapoints[0]
    chart.config.data.datasets[1].data = chartDatapoints[1]
    chart.config.data.datasets[2].data = chartDatapoints[2]
    chart.config.data.datasets[3].data = chartDatapoints[3]

    if (group.startsWith('grp') || group.startsWith('intake')) {
      chart.config.data.datasets[3].type = 'bar'
      chart.config.data.datasets[3].backgroundColor = 'rgba(62, 103, 20, 0.2)'
      chart.config.data.datasets[3].borderColor = 'rgba(62, 103, 20, 1)'
    } else {
      chart.config.data.datasets[3].type = 'line'
      chart.config.data.datasets[3].borderColor = '#ff0000'
    }

    chart.show(0)
    chart.show(1)
    chart.show(2)
    chart.show(3)

    chart.update()
  } else {
    if (group.startsWith('grp') || group.startsWith('intake')) {
      chartData = {
        labels: chartDateLabels,
        datasets: [{
          label: chartDatasetLabels[0],
          data: chartDatapoints[0],
          borderWidth: 1,
          backgroundColor: 'rgba(255, 26, 104, 0.2)',
          borderColor: 'rgba(255, 26, 104, 1)'
        },
        {
          label: chartDatasetLabels[1],
          data: chartDatapoints[1],
          borderWidth: 1,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)'
        },
        {
          label: chartDatasetLabels[2],
          data: chartDatapoints[2],
          borderWidth: 1,
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)'
        },
        {
          label: chartDatasetLabels[3],
          data: chartDatapoints[3],
          borderWidth: 1,
          backgroundColor: 'rgba(62, 103, 20, 0.2)',
          borderColor: 'rgba(62, 103, 20, 1)'
        }]
      }
    } else {
      chartData = {
        labels: chartDateLabels,
        datasets: [{
          label: chartDatasetLabels[0],
          data: chartDatapoints[0],
          borderWidth: 1,
          backgroundColor: 'rgba(255, 26, 104, 0.2)',
          borderColor: 'rgba(255, 26, 104, 1)'
        },
        {
          label: chartDatasetLabels[1],
          data: chartDatapoints[1],
          borderWidth: 1,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)'
        },
        {
          label: chartDatasetLabels[2],
          data: chartDatapoints[2],
          borderWidth: 1,
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)'
        },
        {
          label: chartDatasetLabels[3],
          data: chartDatapoints[3],
          type: 'line',
          borderWidth: 1,
          borderColor: '#ff0000'
        }]
      }
    }

    const data = chartData

    // config
    const config = {
      type: 'bar',
      data,
      options: {
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Storage'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    }

    // render chart initialization block
    chart = new Chart(
      document.getElementById('chart'),
      config
    )
  }

  // Have the buttons have the same color as the corresponding dataset bars.
  document.getElementById('legend-research').style.backgroundColor = chart.data.datasets[0].backgroundColor
  document.getElementById('legend-vault').style.backgroundColor = chart.data.datasets[1].backgroundColor
  document.getElementById('legend-revisions').style.backgroundColor = chart.data.datasets[2].backgroundColor

  if (group.startsWith('grp') || group.startsWith('intake')) {
    document.getElementById('legend-research').style.visibility = 'hidden'
    document.getElementById('legend-vault').style.visibility = 'hidden'
    document.getElementById('legend-revisions').style.visibility = 'hidden'
  } else {
    document.getElementById('legend-research').style.visibility = 'visible'
    document.getElementById('legend-vault').style.visibility = 'visible'
    document.getElementById('legend-revisions').style.visibility = 'visible'
  }
}

function chartToggleData (legendButton) { // eslint-disable-line no-unused-vars
  const visibilityData = chart.isDatasetVisible(legendButton)
  chartVisibilityStatus[legendButton] = !visibilityData

  // calculate new totals.
  const newTotals = []
  let i = 0
  const length = chart.config.data.datasets[0].data.length
  while (i < length) {
    newTotals[i] = 0
    let j = 0
    while (j < 3) {
      if (chartVisibilityStatus[j]) {
        newTotals[i] = newTotals[i] + chart.config.data.datasets[j].data[i]
      }
      j++
    }
    i++
  }

  if (visibilityData) {
    chart.config.data.datasets[3].data = newTotals
    chart.hide(legendButton)
    // set the button labels correctly including strike through
    document.getElementById('legend-' + chartDatasetLabels[legendButton].toLowerCase()).innerHTML = '<strike>' + chartDatasetLabels[legendButton] + '</strike>'
  } else {
    chart.config.data.datasets[3].data = newTotals
    chart.show(legendButton)
    // set the button labels correctly
    document.getElementById('legend-' + chartDatasetLabels[legendButton].toLowerCase()).innerHTML = chartDatasetLabels[legendButton]
  }
}

// Filter data based on the start and end date datepickers in the frontend
function chartFilterDate () {
  const dates = [...chartDateLabels]

  const startdate = document.getElementById('startdate').value
  const enddate = document.getElementById('enddate').value

  // check datepicker values against the values in the array of dates present and select the nearest to the picked date.
  const nearstartdate = getNearestDate(startdate)
  const nearenddate = getNearestDate(enddate)

  const indexstartdate = dates.indexOf(nearstartdate)
  const indexenddate = dates.indexOf(nearenddate)

  if (indexstartdate === -1 || indexenddate === -1) {
    console.log('invalid period')
    return
  }
  const filterDate = dates.slice(indexstartdate, indexenddate + 1)

  chart.config.data.labels = filterDate

  const arAllDatapoints = [[...chartDatapoints[0]], [...chartDatapoints[1]], [...chartDatapoints[2]], [...chartDatapoints[3]]]
  const filterDatapoints = []

  // Split into relevant data only.
  let i = 0
  while (i < 3) {
    filterDatapoints[i] = arAllDatapoints[i].slice(indexstartdate, indexenddate + 1)
    i++
  }

  // New totalization per day.
  filterDatapoints[3] = []
  let day = 0

  while (day < filterDatapoints[0].length) {
    filterDatapoints[3][day] = filterDatapoints[0][day] + filterDatapoints[1][day] + filterDatapoints[2][day]
    let newTotal = 0
    let j = 0
    while (j < 3) {
      if (chartVisibilityStatus[j]) {
        newTotal = newTotal + filterDatapoints[j][day]
      }
      j++
    }
    filterDatapoints[3][day] = newTotal

    day++
  }

  // Pass all datasets to chart
  i = 0
  while (i < 4) {
    // filterDatapoints[i] = arAllDatapoints[i].slice(indexstartdate, indexenddate + 1);
    chart.config.data.datasets[i].data = filterDatapoints[i]
    i++
  }

  chart.update()
}

function startBrowsing () {
  $('#group-browser').DataTable({
    // "bFilter": true,
    bInfo: false,
    bLengthChange: true,
    language: {
      emptyTable: 'No group information present.',
      lengthMenu: '_MENU_'
    },
    dom: '<"top">frt<"bottom"lp><"clear">',
    columns: [{ render: tableRenderer.name, data: 'name', bSearchable: true },
      { render: tableRenderer.size, data: 'size' },
      { render: tableRenderer.member_count, data: 'member_count', orderable: false }],
    ajax: getFolderContents,
    processing: true,
    serverSide: true,
    iDeferLoading: 0,
    order: [[0, 'asc']],
    pageLength: parseInt(Yoda.settings.number_of_items),
    // "searching": true,
    fnDrawCallback: function () {
      $('#group-browser td').click(function () {
        const groupName = $(this).parent().find('.list-group-item').attr('data-name')
        getGroupDetails(groupName)
        $('#selected-group').html('Group [' + groupName + ']')
      })
    }
  })

  const groupBrowser = $('#group-browser').DataTable()
  getFolderContents.dropCache()
  groupBrowser.ajax.reload()

  // to prevent dtatables own search field from showing
  $('#group-browser_filter').addClass('hidden')

  return true
}

// rendering part

// getFolderContents
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
  let cacheSearch = '' // Cached searching criterium.
  let i = 0 // Keep simultaneous requests from interfering.

  const get = async (args) => {
    // Check if we can use the cache.
    if (cache.length &&
         args.order[0].dir === cacheSortOrder &&
         args.order[0].column === cacheSortCol &&
         $('#search-group-table').val() === cacheSearch &&
         args.start >= cacheStart &&
         args.start + args.length <= cacheStart + batchSize) {
      return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length)
    } else {
      // Nope, load new data via the API.
      const j = ++i
      const result = await Yoda.call('resource_browse_group_data',
        {
          offset: args.start,
          limit: batchSize,
          sort_order: args.order[0].dir,
          sort_on: ['name', 'size'][args.order[0].column],
          search_groups: $('#search-group-table').val()
        })

      // If another requests has come while we were waiting, simply drop this one.
      if (i !== j) return null

      // Update cache info.
      total = result.total
      cacheStart = args.start
      cache = result.items
      // cacheFolder    = currentFolder;
      cacheSearch = $('#search-group-table').val()
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
    return `<div class="list-group-item group" data-name="${name}" >${htmlEncode(name)}</div>`
  },
  size: (size, _, row) => {
    return '<span aria-hidden="true" title="' +
            `Research: ${humanReadableSize(size[0])} (${size[0]}), ` +
            `Vault: ${humanReadableSize(size[1])} (${size[1]}), ` +
            `Revision: ${humanReadableSize(size[2])} (${size[2]}), ` +
            `Total: ${humanReadableSize(size[3])} (${size[3]})` +
            `"'>${humanReadableSize(size[3])} </span>`
  }
}

function humanReadableSize (size) {
  const szs = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']
  let szi = 0
  while (size >= 1024 && szi < szs.length - 1) {
    size /= 1024
    szi++
  }
  return (Math.floor(size * 10) / 10 + '') + '&nbsp;' + szs[szi]
}

function htmlEncode (value) {
  // create a in-memory div, set it's inner text(which jQuery automatically encodes)
  // then grab the encoded contents back out.  The div never exists on the page.
  return $('<div/>').text(value).html().replace('"', '&quot;')
}

function getNearestDate (findDate) {
  // Find the nearest date in chartDateLabels
  const dates = [...chartDateLabels]

  const findMe = new Date(findDate)
  const [closest] = dates.sort((a, b) => {
    const [aDate, bDate] = [a, b].map(d => Math.abs(new Date(d) - findMe))

    return aDate - bDate
  })
  return closest
}
