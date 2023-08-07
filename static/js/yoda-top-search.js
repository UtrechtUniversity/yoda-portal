'use strict'

$(document).ready(function () {
    // go to the actual search page
    $('.top-start-search').on('click', function () {
        let t = $('#top_search_concept').attr('data-type');
        let q = '';
        if (t=='status') {
            q = $('#top-search-status').val();
        } else {
            q = $('#q').val();
        }
        goto_search(q, t);
    });

    $('#top-search-panel li a').on('click', function () {
        let type = $(this).attr('data-type');
        if (type == 'status') {
            $('#top-search-status').removeClass('hidden');
            $('#q').hide();
            $('.top-start-search').hide();
        } else {
            $('#top-search-status').addClass('hidden');
            $('#q').show();
            $('.top-start-search').show();
        }
        $('#top_search_concept').attr('data-type', $(this).attr('data-type'));
        $('#top_search_concept').text($(this).text());
    });

    $('#q').bind('keypress', function (e) {
        if (e.keyCode === 13) {
            let q = $('#q').val();
            let t = $('#top_search_concept').attr('data-type');
            goto_search(q, t);
        }
    });

    $('.top-search-status').on('change', function () {
        let q = $('#top-search-status').val();
        let t = $('#top_search_concept').attr('data-type');
        goto_search(q, t)
    })
});

function goto_search(q, t) {
    console.log('goto search');
    console.log(t);
    window.location.href = '/search/?q=' + encodeURIComponent(q) + '&t='+ encodeURIComponent(t);
}
