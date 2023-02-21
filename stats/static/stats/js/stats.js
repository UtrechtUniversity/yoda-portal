var months = {
    1: 'Jan',
    2: 'Feb',
    3: 'Mar',
    4: 'Apr',
    5: 'May',
    6: 'Jun',
    7: 'Jul',
    8: 'Aug',
    9: 'Sep',
    10: 'Oct',
    11: 'Nov',
    12: 'Dec'
};

$(document).ready(function() {
    if ($('#group-browser').length) {
        startBrowsing(10);
    }

    $('#search-group-table').on( 'keyup', function () {
        $('#group-browser').DataTable().search( $('#search-group-table').val() ).draw();
    } );

    $('#startdate_min').on('click', function() {
        $('#startdate').val(chart_date_labels[0]);
        chartFilterDate();
    });
    $('#enddate_max').on('click', function() {
        $('#enddate').val(chart_date_labels[chart_date_labels.length-1]);
        chartFilterDate();
    });

});

// CHART DATA VARIABLES
// Dataset labels - this order is essential
const chart_dataset_labels = ['Research', 'Vault', 'Revisions', 'Total'];
// Labels on the x-axis -> dates
var chart_date_labels = [];

// 4 dimensional array holding all data for research, vault, revisions and total
var chart_datapoints = [[], [], [], []];

var myChart;

// Representation of visibilty of each dataset (research, vault, revisions)
var chart_visibility_status = [true, true, true];

// Handling of new chart
function getGroupDetails(group) {
    // when data is present show chart including the date buttons and legend.
    Yoda.call('resource_full_year_differentiated_group_storage',
              {group_name: group}).then((data) => {

        // Labels on the x-axis -> dates
        chart_date_labels = data.labels;

        // 4 dimensional array holding all data for research, vault, revisions and total
        var nr_of_points = 0;
        var chart_totals = [];
        while (nr_of_points < data.research.length) {
            chart_totals[nr_of_points] = data.research[nr_of_points] + data.vault[nr_of_points] + data.revision[nr_of_points];
            nr_of_points++;
        }

        chart_datapoints = [data.research, data.vault, data.revision, chart_totals];

        if (nr_of_points > 0) {
            // Take over the min/max date range based upon the actual dataset minimum and maximum.
            document.getElementById('startdate').value = chart_date_labels[0];
            document.getElementById('enddate').value = chart_date_labels[nr_of_points-1];

            // Set chart the buttons to the initial text again.
            document.getElementById('legend-' + chart_dataset_labels[0].toLowerCase()).innerHTML = '&nbsp;' + chart_dataset_labels[0] + '&nbsp;';
            document.getElementById('legend-' + chart_dataset_labels[1].toLowerCase()).innerHTML = '&nbsp;' + chart_dataset_labels[1] + '&nbsp;';
            document.getElementById('legend-' + chart_dataset_labels[2].toLowerCase()).innerHTML = '&nbsp;' + chart_dataset_labels[2] + '&nbsp;';

            // Reset the representation of visibilty of each dataset (research, vault, revisions).
            chart_visibility_status = [true, true, true];

            // Make chart visible and hide messaging part.
            $('#storage-chart').removeClass('hidden');
            $('#storage-chart-message').addClass('hidden');

            chartShow(); // Create or update of chart.
        }
        else {
            $("#storage-chart-message").html("<p>No storage information found.</p>");
            $('#storage-chart').addClass('hidden');
            $('#storage-chart-message').removeClass('hidden');
        }
    });
}


function chartShow() {
    if (myChart) {
        myChart.config.data.labels = chart_date_labels;
        myChart.config.data.datasets[0].data = chart_datapoints[0];
        myChart.config.data.datasets[1].data = chart_datapoints[1];
        myChart.config.data.datasets[2].data = chart_datapoints[2];
        myChart.config.data.datasets[3].data = chart_datapoints[3];

        myChart.show(0);
        myChart.show(1);
        myChart.show(2);

        myChart.update();
    }
    else {
      const data = {
        labels: chart_date_labels,
        datasets: [{
          label: chart_dataset_labels[0],
          data: chart_datapoints[0],
          borderWidth: 1,
          backgroundColor: 'rgba(255, 26, 104, 0.2)',
          borderColor: 'rgba(255, 26, 104, 1)'
        },
        {
          label: chart_dataset_labels[1],
          data: chart_datapoints[1],
          borderWidth: 1,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)'
        },
        {
          label: chart_dataset_labels[2],
          data: chart_datapoints[2],
          borderWidth: 1,
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)'
        },
        {
          label: chart_dataset_labels[3],
          data: chart_datapoints[3],
          type: 'line',
          borderWidth: 1,
          borderColor: '#ff0000'
        }]
      };

      // config
      const config = {
          type: 'bar',
          data,
          options: {
              scales: {
                  x: {
                      stacked: true,
                  },
                  y: {
                      stacked: true
                  }
              },
              plugins: {
                  legend: {
                      display: false,
                  }
              }
           }
      };

      // render chart initialization block
      myChart = new Chart(
        document.getElementById('myChart'),
        config
      );
    }

    // Have the buttons have the same color as the corresponding dataset bars.
    document.getElementById('legend-research').style.backgroundColor = myChart.data.datasets[0].backgroundColor;
    document.getElementById('legend-vault').style.backgroundColor = myChart.data.datasets[1].backgroundColor;
    document.getElementById('legend-revisions').style.backgroundColor = myChart.data.datasets[2].backgroundColor;
}


function chartToggleData(legend_button) {
    var visibilityData = myChart.isDatasetVisible(legend_button);
    chart_visibility_status[legend_button] = !visibilityData;

    // calculate new totals.
    var new_totals = []
    var i = 0;
    var length = myChart.config.data.datasets[0].data.length;
    while (i < length) {
        new_totals[i] = 0;
        j = 0;
        while (j < 3) {
            if (chart_visibility_status[j]) {
	        new_totals[i] = new_totals[i] + myChart.config.data.datasets[j].data[i];
	    }
	    j++;
	}
        i++;
    }

    if(visibilityData) {
        myChart.config.data.datasets[3].data = new_totals;
        myChart.hide(legend_button);
        // set the button labels correctly including strike through
        document.getElementById('legend-' + chart_dataset_labels[legend_button].toLowerCase()).innerHTML = '&nbsp;<strike>' + chart_dataset_labels[legend_button] + '</strike>&nbsp;';
    }
    else {
        myChart.config.data.datasets[3].data = new_totals;
        myChart.show(legend_button);
        // set the button labels correctly
        document.getElementById('legend-' + chart_dataset_labels[legend_button].toLowerCase()).innerHTML = '&nbsp;' + chart_dataset_labels[legend_button] + '&nbsp;';
    }
}



// Filter data based on the start and end date datepickers in the frontend
function chartFilterDate() {
    const dates = [...chart_date_labels];

    const startdate = document.getElementById("startdate").value;
    const enddate = document.getElementById("enddate").value;

    // check datepicker values against the values in the array of dates present and select the nearest to the picked date.
    const nearstartdate = getNearestDate(startdate);
    const nearenddate = getNearestDate(enddate);

    const indexstartdate = dates.indexOf(nearstartdate);
    const indexenddate = dates.indexOf(nearenddate);

    if (indexstartdate == -1 || indexenddate == -1) {
        console.log('invalid period');
        return;
    }
    const filterDate = dates.slice(indexstartdate, indexenddate + 1);

    myChart.config.data.labels = filterDate;

    const ar_all_datapoints = [[...chart_datapoints[0]],[...chart_datapoints[1]], [...chart_datapoints[2]], [...chart_datapoints[3]]];
    const filterDatapoints = [];

    // Split into relevant data only.
    var i = 0;
    while (i < 3) {
        filterDatapoints[i] = ar_all_datapoints[i].slice(indexstartdate, indexenddate + 1);
        // myChart.config.data.datasets[i].data = filterDatapoints[i];
        i++;
    }

    // New totalization per day.
    filterDatapoints[3] = [];
    var day = 0;

    while (day < filterDatapoints[0].length) {
        filterDatapoints[3][day] = filterDatapoints[0][day] + filterDatapoints[1][day] + filterDatapoints[2][day];
        new_total = 0;
        j = 0;
        while (j < 3) {
            if (chart_visibility_status[j]) {
                new_total = new_total + filterDatapoints[j][day];
            }
            j++;
        }
        filterDatapoints[3][day] = new_total;

        day++;
    }

    // Pass all datasets to chart
    i = 0;
    while (i < 4) {
        //filterDatapoints[i] = ar_all_datapoints[i].slice(indexstartdate, indexenddate + 1);
        myChart.config.data.datasets[i].data = filterDatapoints[i];
        i++;
    }

    myChart.update();
}

// Old chart handling
function getGroupDetailsOld(group) {
    Yoda.call('resource_full_year_differentiated_group_storage', //'resource_full_year_group_data',
              {group_name: group}).then((data) => {

          if (data.total_storage > 0) {
              $("#storage-chart").html("<canvas class=\"storage-data\" width=\"400\" height=\"400\"></canvas>");
              var ctx = $('.storage-data');
              var datasets = [];
              var labels = []; // x-axis

              var dataset_desc = {'research': 'Research space', 'vault': 'Vault space', 'revision': 'Revision space', 'total': 'Total'}

              // Do it here
              $.each(data.months, function (index, month) {
                 labels.push(months[month]);
              });

              $.each(data.spaces, function (name, storageData) {
                  var storageChartData = [];

                  // var storageResearch = [];
                  // var storageVault = [];
                  // var storageRevision = [];
                  // var storageTotal = [];
/*
                  var storageResearch = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
                  var storageVault = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
                  var storageRevision = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

                  // Moet hier worden gesommeerd?? of al in backend worden voorbereid ook ivm 0.1T
                  for (let i = 0; i < 12; i++) {
                      storageTotal[i] = storageResearch[i] + storageVault[i] + storageRevision[i]
                  }
*/
                  $.each(data.months, function (index, month) {
                      //if ($.inArray(month, labels) === -1) {
                      //    labels.push(months[month]);
                      //}

                      // data.months contains month-numbers. I.e. [12,1,2,3,4,5,6,7,8,9,10,11]
                      // The order is in presentation order.
                      // The storageData, month based, is zero-based however. And in ascending order.
                      // 0=Jan,..., 10=nov, 11=dec
                      // Therefore, a correction has to take place shift by 1 to have the values coincide with the actual month

                      storageChartData.push(storageData[month-1]);
                  });

                  var spaceObject = {
                      label: dataset_desc[name],
                      data: storageChartData,
                      backgroundColor: darkColorGenerator()
                  };

                  datasets.push(spaceObject);
              });

              var chartData = {
                  labels: labels,
                  datasets: datasets,
              };

              var chartOptions = {
                  scales: {
                      x: {stacked: true},
                      y: {stacked: true},
                      xAxes: [{
                          barPercentage: 1,
                          categoryPercentage: 0.6,
                          scaleLabel: {
                              display: true,
                              labelString: 'Months'
                          }
                      }],
                      yAxes: [{
                          scaleLabel: {
                              display: true,
                              labelString: 'TB',
                          },
                          ticks: {
                              min: 0, // it is for ignoring negative step.
                              beginAtZero: true,
                              callback: function(value, index, values) {
                                  if ($('canvas').data('storage') == 'Terabytes') {
                                      if (value.countDecimals() < 2) {
                                          return value;
                                      }
                                  } else {
                                      return value;
                                  }
                              }
                          }
                      }]
                  }
              };

              var chart = new Chart(ctx, {
                  type: 'bar',
                  data: chartData,
                  options: chartOptions
              });
         } else {
              $("#storage-chart").html("<p>No storage information found.</p>");
         }
    });
}

var darkColorGenerator = function () {
    var letters = '0123456789'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 10)];
    }
    return color;
};


Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0;
}


function startBrowsing(pageLength)
{
    $('#group-browser').DataTable({
        //"bFilter": true,
        "bInfo": false,
        "bLengthChange": true,
        "language": {
            "emptyTable": "No group information present.",
            "lengthMenu": "_MENU_"
        },
        "dom": '<"top">frt<"bottom"lp><"clear">',
        'columns': [{render: tableRenderer.name,    data: 'name', bSearchable: true},
                    {render: tableRenderer.size,    data: 'size'}],
        "ajax": getFolderContents,
        "processing": true,
        "serverSide": true,
        "iDeferLoading": 0,
        "order": [[ 0, "asc" ]],
        "pageLength": pageLength,
        // "searching": true,
        "fnDrawCallback": function() {
             $("#group-browser td").click(function() {
                 var groupName = $(this).parent().find('.list-group-item').attr('data-name');
                 getGroupDetails(groupName);
                 $('#selected-group').html('Group [' + groupName + ']');
             });
        }
    });

    let groupBrowser = $('#group-browser').DataTable();
    getFolderContents.dropCache();
    groupBrowser.ajax.reload();

    // to prevent dtatables own search field from showing
    $('#group-browser_filter').addClass('hidden');

    return true;
}

// rendering part

// getFolderContents
// Fetches directory contents to populate the listing table.
let getFolderContents = (() => {
    // Close over some state variables.
    // -> we keep a multi-page cache handy, since getting only $page_length [=10]
    //    results each time is wasteful and slow.
    // A change in sort column/order or folder will invalidate the cache.

    // The amount of rows to request at once.
    // *Must* be equal to or greater than the largest datatables page length,
    // and *should* be smaller than iRODS SQL rows per batch.
    const batchSize = 200;
    // (~140 B per entry in JSON returned by iRODS,
    //  so depending on name = up to 28K to transfer for each fetch)

    let total          = false; // Total subcollections / data objects.
    let cache          = [];    // Cached result rows (may be more than shown on one page).
    let cacheStart     = null;  // Row number of the first cache entry.
    let cacheSortCol   = null;  // Cached sort column nr.
    let cacheSortOrder = null;  // Cached sort order.
    let cacheSearch    = "";  // Cached searching criterium.
    let i = 0;                  // Keep simultaneous requests from interfering.

    let get = async (args) => {
        // Check if we can use the cache.
        if (cache.length
         && args.order[0].dir    === cacheSortOrder
         && args.order[0].column === cacheSortCol
         && $('#search-group-table').val() === cacheSearch
         && args.start               >= cacheStart
         && args.start + args.length <= cacheStart + batchSize) {

            return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length);
        } else {
            // Nope, load new data via the API.
            let j = ++i;
            let result = await Yoda.call('resource_browse_group_data',
                                         {'offset':     args.start,
                                          'limit':      batchSize,
                                          'sort_order': args.order[0].dir,
                                          'sort_on':    ['name','size'][args.order[0].column],
                                          'search_groups': $('#search-group-table').val()});

            // If another requests has come while we were waiting, simply drop this one.
            if (i !== j) return null;

            // Update cache info.
            total          = result.total;
            cacheStart     = args.start;
            cache          = result.items;
            // cacheFolder    = currentFolder;
            cacheSearch    =  $('#search-group-table').val();
            cacheSortCol   = args.order[0].column;
            cacheSortOrder = args.order[0].dir;

            return cache.slice(args.start - cacheStart, args.length);
        }
    };

    // The actual function passed to datatables.
    // (needs a non-async wrapper cause datatables won't accept it otherwise)
    let fn = (args, cb, settings) => (async () => {

        let data = await get(args);
        if (data === null)
            return;

        cb({'data':            data,
            'recordsTotal':    total,
            'recordsFiltered': total });
    })();

    // Allow manually clearing results (needed during soft-reload after uploading a file).
    fn.dropCache = () => cache = [];
    return fn;
})();


// Functions for rendering table cells, per column.
const tableRenderer = {
    name: (name, _, row) => {
        return `<div class="list-group-item group" data-name="${name}" >${htmlEncode(name)}</div>`;
    },
    size: (size, _, row) => {
        return `${ human_readable_size(size[0])} <i class="fa-solid fa-circle-info" aria-hidden="true" title="` + 
            `Research: ${human_readable_size(size[1])} (${size[1]}), ` +
            `Vault: ${human_readable_size(size[2])} (${size[2]}), ` +
            `Revision: ${human_readable_size(size[3])} (${size[3]}), ` +
                `TOTAL: ${human_readable_size(size[0])} (${size[0]}), ` +
            `"'>`;
    }
};


function human_readable_size(size) {
            var szs = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
            var szi = 0;
            while (size >= 1024 && szi < szs.length-1) {
                size /= 1024;
                szi++;
            }
    return (Math.floor(size*10)/10+'') + '&nbsp;' + szs[szi]
}


function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html().replace('"', '&quot;');
}


function getNearestDate(find_date) {
    // Find the nearest date in chart_date_labels
    const dates = [...chart_date_labels];

    find_me = new Date(find_date);
    var [ closest ] = dates.sort((a,b) => {

       const [aDate, bDate] = [a,b].map(d => Math.abs(new Date(d) - find_me));

       return aDate - bDate;

     });
     return closest;
}
