'use strict'

$(document).ready(function () {
  // go to the actual search page
  $('.top-start-search').on('click', function () {
    const t = $('#top_search_concept').attr('data-type')
    let q = ''
    if (t === 'status') {
      q = $('#top-search-status').val()
    } else {
      q = $('#q').val()
    }
    gotoSearch(q, t)
  })

  $('#top-search-panel li a').on('click', function () {
    const type = $(this).attr('data-type')
    if (type === 'status') {
      $('#top-search-status').removeClass('hidden')
      $('#q').hide()
      $('.top-start-search').hide()
    } else {
      $('#top-search-status').addClass('hidden')
      $('#q').show()
      $('.top-start-search').show()
    }
    $('#top_search_concept').attr('data-type', $(this).attr('data-type'))
    $('#top_search_concept').text($(this).text())
  })

  $('#q').bind('keypress', function (e) {
    if (e.keyCode === 13) {
      const q = $('#q').val()
      const t = $('#top_search_concept').attr('data-type')
      gotoSearch(q, t)
    }
  })

  $('.top-search-status').on('change', function () {
    const q = $('#top-search-status').val()
    const t = $('#top_search_concept').attr('data-type')
    gotoSearch(q, t)
  })
})

function gotoSearch (q, t) {
  window.location.href = '/search/?q=' + encodeURIComponent(q) + '&t=' + encodeURIComponent(t)
}
