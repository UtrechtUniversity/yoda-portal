/* global Chart, DataTable */
'use strict'

document.addEventListener('DOMContentLoaded', function () {
  const groupBrowser = document.getElementById('group-browser')

  if (groupBrowser) {
    startBrowsing()
  }

  const searchGroupTable = document.getElementById('search-group-table')
  searchGroupTable.addEventListener('keyup', function () {
    if (groupBrowser._dataTableInstance) {
      groupBrowser._dataTableInstance.search(searchGroupTable.value).draw()
    }
  })

  const startDateMin = document.getElementById('startdate_min')
  startDateMin.addEventListener('click', function () {
    const startDateInput = document.getElementById('startdate')
    startDateInput.value = getISODateString(chartDateLabels[0])
    chartFilterDate()
  })

  const endDateMax = document.getElementById('enddate_max')
  endDateMax.addEventListener('click', function () {
    const endDateInput = document.getElementById('enddate')
    endDateInput.value = getISODateString(chartDateLabels[chartDateLabels.length - 1])
    chartFilterDate()
  })
})

// CHART DATA VARIABLES
// Dataset labels - this order is essential
const chartDatasetLabels = ['Research', 'Vault', 'Revisions', 'Total']

// Labels on the x-axis -> dates
let chartDateLabels = []

// 4 dimensional array holding all data for research, vault, revisions and total
let chartDatapoints = [[], [], [], []]

let chart

// Representation of visibilty of each dataset (research, vault, revisions)
let chartVisibilityStatus = [true, true, true]

// Handling of new chart
function getGroupDetails (group) {
  // When data is present, show chart including the date buttons and legend.
  Yoda.call('resource_full_year_differentiated_group_storage', { group_name: group }).then((data) => {
    // Labels on the x-axis -> dates
    chartDateLabels = data.labels

    // 4-dimensional array holding all data for research, vault, revisions, and total
    let nrOfPoints = 0
    const chartTotals = []
    const totals = []

    while (nrOfPoints < data.research.length) {
      chartTotals[nrOfPoints] = data.research[nrOfPoints] + data.vault[nrOfPoints] + data.revision[nrOfPoints]
      totals[nrOfPoints] = data.total[nrOfPoints]

      // This can happen when old statistics data has been upgraded
      if (totals[nrOfPoints] > chartTotals[nrOfPoints]) {
        chartTotals[nrOfPoints] = totals[nrOfPoints]
      }

      nrOfPoints++
    }

    if (group.startsWith('grp') || group.startsWith('intake')) {
      chartDatapoints = [data.research, data.vault, data.revision, data.total]
    } else {
      chartDatapoints = [data.research, data.vault, data.revision, chartTotals]
    }

    const storageChart = document.getElementById('storage-chart')
    const storageChartMessage = document.getElementById('storage-chart-message')

    if (nrOfPoints > 0) {
      // Take over the min/max date range based upon the actual dataset minimum and maximum.
      document.getElementById('startdate').value = chartDateLabels[0]
      document.getElementById('enddate').value = chartDateLabels[nrOfPoints - 1]

      // Set chart buttons to the initial text again.
      document.getElementById('legend-' + chartDatasetLabels[0].toLowerCase()).innerHTML = chartDatasetLabels[0]
      document.getElementById('legend-' + chartDatasetLabels[1].toLowerCase()).innerHTML = chartDatasetLabels[1]
      document.getElementById('legend-' + chartDatasetLabels[2].toLowerCase()).innerHTML = chartDatasetLabels[2]

      // Reset the representation of visibility of each dataset (research, vault, revisions).
      chartVisibilityStatus = [true, true, true]

      // Make chart visible and hide messaging part.
      storageChart.classList.remove('hidden')
      storageChartMessage.classList.add('hidden')

      chartShow(group) // Create or update the chart.
    } else {
      const message = '<p>No storage information found.</p>'
      storageChartMessage.innerHTML = message
      storageChart.classList.add('hidden')
      storageChartMessage.classList.remove('hidden')
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
    } else if (group.startsWith('deposit')) {
      chart.config.data.datasets[0].label = 'Deposit'
      chart.config.data.datasets[3].type = 'line'
      chart.config.data.datasets[3].borderColor = '#ff0000'
    } else {
      chart.config.data.datasets[0].label = 'Research'
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

    // config
    const config = {
      type: 'bar',
      data: chartData,
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
  document.getElementById('legend-deposit').style.backgroundColor = chart.data.datasets[0].backgroundColor
  document.getElementById('legend-research').style.backgroundColor = chart.data.datasets[0].backgroundColor
  document.getElementById('legend-vault').style.backgroundColor = chart.data.datasets[1].backgroundColor
  document.getElementById('legend-revisions').style.backgroundColor = chart.data.datasets[2].backgroundColor

  if (group.startsWith('grp') || group.startsWith('intake')) {
    document.getElementById('legend-deposit').style.display = 'none'
    document.getElementById('legend-research').style.display = 'none'
    document.getElementById('legend-vault').style.display = 'none'
    document.getElementById('legend-revisions').style.display = 'none'
  } else if (group.startsWith('deposit')) {
    document.getElementById('legend-research').style.display = 'none'
    document.getElementById('legend-deposit').style.display = 'block'
    document.getElementById('legend-revisions').style.display = 'block'
    document.getElementById('legend-vault').style.display = 'block'
  } else if (group.startsWith('research')) {
    document.getElementById('legend-deposit').style.display = 'none'
    document.getElementById('legend-research').style.display = 'block'
    document.getElementById('legend-revisions').style.display = 'block'
    document.getElementById('legend-vault').style.display = 'block'
  }
}

function chartToggleData (legendButton) { // eslint-disable-line no-unused-vars
  const visibilityData = chart.isDatasetVisible(legendButton)
  chartVisibilityStatus[legendButton] = !visibilityData

  chartFilterDate()

  const legendElement = document.getElementById('legend-' + chartDatasetLabels[legendButton].toLowerCase())
  if (visibilityData) {
    chart.hide(legendButton)
    // Set the button labels correctly including strike through
    legendElement.innerHTML = '<strike>' + chartDatasetLabels[legendButton] + '</strike>'
  } else {
    chart.show(legendButton)
    // Set the button labels correctly
    legendElement.innerHTML = chartDatasetLabels[legendButton]
  }
}

// Filter data based on the start and end date datepickers in the frontend
function chartFilterDate () {
  const dates = [...chartDateLabels]

  const startdate = new Date(document.getElementById('startdate').value)
  const enddate = new Date(document.getElementById('enddate').value)

  // Check datepicker values against the values in the array of dates present and select the nearest to the picked date.
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

  const arAllDatapoints = [
    [...chartDatapoints[0]],
    [...chartDatapoints[1]],
    [...chartDatapoints[2]],
    [...chartDatapoints[3]]
  ]
  const filterDatapoints = []

  // Split into relevant data only.
  for (let i = 0; i < 4; i++) {
    filterDatapoints[i] = arAllDatapoints[i].slice(indexstartdate, indexenddate + 1)
  }

  for (let day = 0; day < filterDatapoints[0].length; day++) {
    let newTotal = 0
    const allAreVisible = chartVisibilityStatus[0] && chartVisibilityStatus[1] && chartVisibilityStatus[2]

    for (let j = 0; j < 3; j++) {
      if (chartVisibilityStatus[j]) {
        newTotal += filterDatapoints[j][day]
      }
    }

    // Handling the case where old statistics data has been upgraded.
    // If all categories are visible, display the old statistics total.
    // If even one category is not visible, default to the calculated total of the visible categories.
    if (!allAreVisible || filterDatapoints[3][day] <= newTotal) {
      filterDatapoints[3][day] = newTotal
    }
  }

  // Pass all datasets to chart
  for (let i = 0; i < 4; i++) {
    chart.config.data.datasets[i].data = filterDatapoints[i]
  }

  chart.update()
}

function startBrowsing () {
  const groupBrowser = document.getElementById('group-browser')
  const dataTable = new DataTable(groupBrowser, {
    bInfo: false,
    bLengthChange: true,
    language: {
      emptyTable: 'No group information present.',
      lengthMenu: '_MENU_'
    },
    dom: '<"top">frt<"bottom"lp><"clear">',
    columns: [
      { render: tableRenderer.name, data: 'name', bSearchable: true },
      { render: tableRenderer.size, data: 'size' },
      { render: tableRenderer.member_count, data: 'member_count', orderable: false }
    ],
    ajax: getFolderContents,
    processing: true,
    serverSide: true,
    iDeferLoading: 0,
    order: [[0, 'asc']],
    fnDrawCallback: function () {
      const cells = groupBrowser.querySelectorAll('td')
      cells.forEach(cell => {
        cell.addEventListener('click', function () {
          const groupName = this.parentElement.querySelector('.list-group-item').getAttribute('data-name')
          getGroupDetails(groupName)
          document.getElementById('selected-group').textContent = 'Group ' + groupName
        })
      })
    },
    pageLength: parseInt(Yoda.storage.session.get('pageLength') === null ? Yoda.settings.number_of_items : Yoda.storage.session.get('pageLength'))
  })
  groupBrowser._dataTableInstance = dataTable
  groupBrowser.addEventListener('length.dt', function (e, settings, len) {
    Yoda.storage.session.set('pageLength', len)
  })

  getFolderContents.dropCache()
  dataTable.ajax.reload()

  // to prevent dtatables own search field from showing
  const filterElement = document.getElementById('group-browser_filter')
  if (filterElement) {
    filterElement.classList.add('hidden')
  }

  return true
}

// rendering part

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
    const searchGroupTable = document.getElementById('search-group-table')

    // Check if we can use the cache.
    if (cache.length &&
         args.order[0].dir === cacheSortOrder &&
         args.order[0].column === cacheSortCol &&
         searchGroupTable.value === cacheSearch &&
         args.start >= cacheStart &&
         args.start + args.length <= cacheStart + batchSize) {
      return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length)
    } else {
      // Nope, load new data via the API.
      const j = ++i
      const result = await Yoda.call('resource_browse_group_data', {
        offset: args.start,
        limit: batchSize,
        sort_order: args.order[0].dir,
        sort_on: ['name', 'size'][args.order[0].column],
        search_groups: searchGroupTable.value
      })

      // If another request has come while we were waiting, simply drop this one.
      if (i !== j) return null

      // Update cache info.
      total = result.total
      cacheStart = args.start
      cache = result.items
      cacheSearch = searchGroupTable.value
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
    return `<div class="list-group-item group" data-name="${name}" >${Yoda.htmlEncode(name)}</div>`
  },
  size: (size, _, row) => {
    const group = row.name
    if (group.startsWith('grp') || group.startsWith('intake')) {
      return '<span aria-hidden="true" title="' +
        `Total: ${humanReadableSize(size[3])}` +
        `"'>${humanReadableSize(size[3])} </span>`
    } else if (group.startsWith('deposit')) {
      return '<span aria-hidden="true" title="' +
            `Deposit: ${humanReadableSize(size[0])}, ` +
            `Vault: ${humanReadableSize(size[1])}, ` +
            `Total: ${humanReadableSize(size[3])}` +
            `"'>${humanReadableSize(size[3])} </span>`
    } else {
      return '<span aria-hidden="true" title="' +
            `Research: ${humanReadableSize(size[0])}, ` +
            `Vault: ${humanReadableSize(size[1])}, ` +
            `Revision: ${humanReadableSize(size[2])}, ` +
            `Total: ${humanReadableSize(size[3])}` +
            `"'>${humanReadableSize(size[3])} </span>`
    }
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

function getISODateString (dateString) {
  // Given a date string in locale format
  // Return string in ISO 8601 formatted date yyyy-mm-dd (no time or timezone, does not correct for timezone)
  const newDate = new Date(dateString)
  return newDate.toISOString().split('T')[0]
}

function getNearestDate (findDate) {
  // Find the nearest date in chartDateLabels
  // Return string in ISO 8601 formatted date yyyy-mm-dd (no time or timezone)
  const dates = chartDateLabels.map(x => new Date(x))

  const [closest] = dates.sort((a, b) => {
    const [aDate, bDate] = [a, b].map(d => Math.abs(d - findDate))

    return aDate - bDate
  })
  return closest.toISOString().split('T')[0]
}
