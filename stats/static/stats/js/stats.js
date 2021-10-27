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

    $(".list-group-item.group").click(function() {
        makeItemActive($(this));
        getGroupDetails($(this).attr('data-name'));
    });
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
                      storageChartData.push(storageData[month]);
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
