"use strict";

let currentSearchString;
let currentSearchType;
let currentSearchItems;

$(document).ready(function() {
    if ($('#file-browser').length && searchType == 'filename') {
        currentSearchString = $("#search-filter").val();
        currentSearchType = $("#search_concept").attr('data-type');
        currentSearchItems = $(".search-btn").attr('data-items-per-page');        
        search();
    }

    $(".search-panel .dropdown-menu a").click(function() {
        $("#search_concept").html($(this).text());
        $("#search_concept").attr('data-type', $(this).attr('data-type'));

        if ($(this).attr('data-type') == 'status') {
            $('.search-term').hide();
            $('.search-status').removeClass('hide').show();
            currentSearchString = undefined;
            currentSearchType = 'status';
            currentSearchItems = $(".search-btn").attr('data-items-per-page');
        } else {
            $('.search-term').removeClass('hide').show();
            $('.search-status').hide();
            currentSearchString = $("#search-filter").val();
            currentSearchType = $("#search_concept").attr('data-type');
            currentSearchItems = $(".search-btn").attr('data-items-per-page');
        }
        search();
    });

    $(".search-btn").click(function() {
        currentSearchString = $("#search-filter").val();
        currentSearchType = $("#search_concept").attr('data-type');
        currentSearchItems = $(".search-btn").attr('data-items-per-page');
        search();
    });

    $("#search-filter").bind('keypress', function(e) {
        if (e.keyCode == 13) {
            currentSearchString = $("#search-filter").val();
            currentSearchType = $("#search_concept").attr('data-type');
            currentSearchItems = $(".search-btn").attr('data-items-per-page');
            search();
        }
    });

    $(".search-status").change(function() {
        currentSearchString = $(this).val();
        currentSearchType = 'status';
        currentSearchItems = $(".search-btn").attr('data-items-per-page');
        search();
    });
});

// Fetches search results to populate the search table.
let getSearchResults = (() => {
    let total = false; // Total subcollections / data objects.
    let i = 0; // Keep simultaneous requests from interfering.

    let get = async (args) => {
        // Load new data via the API.
        let j = ++i;
        let result = await Yoda.call('search', {
            'search_string': currentSearchString,
            'search_type': currentSearchType,
            'offset': args.start,
            'limit': $("select[name='search_length']").val(),
            'sort_order': args.order[0].dir,
            'sort_on': ['name', 'size', 'modified'][args.order[0].column]
        });

        // If another requests has come while we were waiting, simply drop this one.
        if (i !== j) return null;

        total = result.total;
        return result.items;
    };

    // The actual function passed to datatables.
    // (needs a non-async wrapper cause datatables won't accept it otherwise)
    let fn = (args, cb, settings) => (async () => {

        let data = await get(args);
        if (data === null)
            return;

        cb({
            'data': data,
            'recordsTotal': total,
            'recordsFiltered': total
        });
    })();

    return fn;
})();

// Functions for rendering table cells, per column.
const resultsRenderer = {
    name: (name, _, row) => {
        let href = '';
        let target = name;
        if (row.type != 'coll') {
            target = name.split("/").slice(0, -1).join("/");
        }

        if (name.startsWith('/research-')) {
            href = "/research/?dir=" + target;
        } else {
            href = "/vault/?dir=" + target;
        }

        if (row.type === 'coll') {
            return `<a class="browse-search" href="${htmlEncode(href)}"><i class="fa fa-folder-o"></i> ${htmlEncode(name)}</a>`;
        } else {
            return `<a class="browse-search" href="${htmlEncode(href)}"><i class="fa fa-file-o"></i> ${htmlEncode(name)}</a>`;
        }
    },
    size: (size, _, row) => {
        if (row.type === 'coll') {
            return '';
        } else {
            let szs = ['B', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
            let szi = 0;
            while (size >= 1024 && szi < szs.length - 1) {
                size /= 1024;
                szi++;
            }
            return (Math.floor(size * 10) / 10 + '') + '&nbsp;' + szs[szi];
        }
    },
    date: ts => {
        let date = new Date(ts * 1000);
        let pad = n => n < 10 ? '0' + n : '' + n;
        let elem = $('<span>');
        elem.text(`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}` +
            ` ${pad(date.getHours())}:${pad(date.getMinutes())}`);
        elem.attr('title', date.toString()); // (should include seconds and TZ info)
        return elem[0].outerHTML;
    }
};

function search() {
    searchOrderDir = 'asc';
    searchOrderColumn = 0;

    if (typeof currentSearchString != 'undefined' && currentSearchString.length > 0 && currentSearchType != 'revision') {
        // Table columns definition.
        let columns = [];
        let renderColumns = [];
        if (currentSearchType == 'filename') {
            columns = ['Name', 'Size', 'Modified date'];
            renderColumns = [{
                    render: resultsRenderer.name,
                    data: 'name'
                },
                {
                    render: resultsRenderer.size,
                    orderable: false,
                    data: 'size'
                },
                {
                    render: resultsRenderer.date,
                    orderable: false,
                    data: 'modify_time'
                }
            ];
        } else if (currentSearchType == 'folder' || currentSearchType == 'status' || currentSearchType == 'metadata') {
            columns = ['Name', 'Modified date'];
            renderColumns = [{
                    render: resultsRenderer.name,
                    data: 'name'
                },
                {
                    render: resultsRenderer.date,
                    orderable: false,
                    data: 'modify_time'
                }
            ];
        } else {
            columns = ['Location'];
            renderColumns = [{
                render: resultsRenderer.name,
                data: 'name'
            }];
        }

        // Destroy current Datatable.
        var datatable = $('#search').DataTable();
        datatable.destroy();

        var tableHeaders = '';
        $.each(columns, function(i, val) {
            tableHeaders += "<th>" + val + "</th>";
        });

        // Create the columns
        $('#search thead tr').html(tableHeaders);

        // Remove table content
        $('#search tbody').remove();

        var encodedSearchString = encodeURIComponent(currentSearchString);
        /* limit the length of the encoded string to the worst case of 255*4*3=3060
         *  maxLength of characters (255) * max bytes in UTF-8 encoded character (4) * URL encoding of byte (%HH) (3)
         */
        if (encodedSearchString.length > 3060) {
            Yoda.set_message('error', 'The search string is too long');
            return true;
        }

        $('#search').DataTable({
            "bFilter": false,
            "bInfo": false,
            "bLengthChange": true,
            "language": {
                "emptyTable": "Your search did not match any documents",
                "lengthMenu": "_MENU_"
            },
            "dom": '<"top">rt<"bottom"lp><"clear">',
            'columns': renderColumns,
            "ajax": getSearchResults,
            "processing": true,
            "serverSide": true,
            "pageLength": $("select[name='search_length']").val() //currentSearchItems,
        });

        if (currentSearchType == 'status') {
            let searchStatus = $(".search-status option:selected").text();
            $('.search-string').text(searchStatus);
        } else {
            $('.search-string').html(htmlEncode(currentSearchString).replace(/ /g, "&nbsp;"));
        }
    }

    if (currentSearchType == 'revision') {
        $('#search').hide();
        $('.search-results').hide();
        $('.revision-results').show();
    } else {
        $('#search').show();
        $('.revision-results').hide();
        $('.search-results').show();
    }

    return true;
}
