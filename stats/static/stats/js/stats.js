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
    $(".list-group-item.resource").click(function() {
        makeItemActive($(this));
        getDetails($(this).attr('data-name'));
    });

    if ($('#group-browser').length) {
        startBrowsing(10);
    }

    $('#search-group-table').on( 'keyup', function () {
        $('#group-browser').DataTable().search( $('#search-group-table').val() ).draw();
    } );
});

function makeItemActive(currentItem)
{
    if ($(currentItem).hasClass('resource')) {
        $('.list-group-item.resource').removeClass('active');
    } else if ($(currentItem).hasClass('group')) {
        $('.list-group-item.group').removeClass('active');
    }

    $(currentItem).addClass('active');
}

function getDetails(resource)
{
    var url = 'resource_details?resource=' + encodeURIComponent(resource);

    $.getJSON(url, function( data ) {
        if (data.status == 'success') {
            $('.resource-details').html(data.html);

            // Select2 plugin - Select tier
            select2Tier();

            $( "#resource-properties-form" ).submit(function( event ) {
                event.preventDefault();
                $('.update-resource-properties-btn').addClass('disabled').val('Updating...');

                var value = $('.tier-select').data('select2').val();
                editTier(resource, value);
            });
        }
    });
}

function getGroupDetails(group) {
    Yoda.call('resource_full_year_group_data',
              {group_name: group}).then((data) => {

          if (data.total_storage > 0) {
              $("#storage-chart").html("<canvas class=\"storage-data\" width=\"400\" height=\"400\"></canvas>");
              var ctx = $('.storage-data');
              var datasets = [];
              var labels = [];

              $.each(data.tiers, function (name, storageData) {
                  var storageChartData = [];
                  $.each(data.months, function (index, month) {
                      if ($.inArray(month, labels) === -1) {
                          labels.push(months[month]);
                      }
                      // data.months contains month-numbers. I.e. [12,1,2,3,4,5,6,7,8,9,10,11]
                      // The order is in presentation order.
                      // The storageData, month based, is zero-based however. And in ascending order.
                      // 0=Jan,..., 10=nov, 11=dec                      
                      // Therefore, a correction has to take place shift by 1 to have the values coincide with the actual month
                      storageChartData.push(storageData[month-1]);
                  });

                  var tierObject = {
                      label: name,
                      data: storageChartData,
                      backgroundColor: darkColorGenerator()
                  };

                  datasets.push(tierObject);
              });

              var chartData = {
                  labels: labels,
                  datasets: datasets,
              };

              var chartOptions = {
                  scales: {
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

function select2Tier()
{
    $('.tier-select').select2({
        ajax: {
            delay:    250,
            url:      'get_tiers',
            type:     'get',
            dataType: 'json',
            data: {},
            processResults: function (tiers) {
                var results = [];
                var query   = $('.tier-select').data('select2').$dropdown.find(':input.select2-search__field').val();
                var inputMatches = false;

                tiers.forEach(function(tier) {
                    if (query === tier) {
                        inputMatches = true;
                    }
                    results.push({
                        id:   tier,
                        text: tier
                    });
                });
                if (!inputMatches && query.length) {
                    results.push({
                        id:     query,
                        text:   query + ' (create)',
                        exists: false
                    });
                }

                return { results: results };
            }
        }
    });
}

async function editTier(resource, val) {
    let result = await Yoda.call('resource_save_tier',
        {resource_name: resource, tier_name: val},
        {rawResult: true}
    );

    if (result.status == 'ok') {
        Yoda.set_message('success', 'Updated  ' + resource + ' properties.');
    } else {
        Yoda.set_message('error', 'Could not update ' + resource + ' properties  due to an internal error.');
    }

    $('.list-group-item.active .resource-tier').attr('title', htmlDecode(val));

    var text = val;
    if (text.length > 10) {
        text = val.substr(0, 10) + '...';
    }
    $('.list-group-item.active .resource-tier').text(htmlDecode(text));

    getDetails(resource);
}

function htmlDecode(inp){
    var replacements = {'&lt;':'<','&gt;':'>','&sol;':'/','&quot;':'"','&apos;':'\'','&amp;':'&','&laquo;':'«','&raquo;':'»','&nbsp;':' ','&copy;':'©','&reg;':'®','&deg;':'°'};
    for(var r in replacements){
        inp = inp.replace(new RegExp(r,'g'),replacements[r]);
    }
    return inp.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
    });
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
            let result = await Yoda.call('browse_group_data', // 'browse_folder',
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
        if (row.type === 'coll') {
            return '';
        } else {
            let szs = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
            let szi = 0;
            while (size >= 1024 && szi < szs.length-1) {
                size /= 1024;
                szi++;
            }
            return (Math.floor(size*10)/10+'') + '&nbsp;' + szs[szi];
        }
    }
};


function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html().replace('"', '&quot;');
}

