'use strict'

window.addEventListener('load', function () {
  // Load notifications.
  Yoda.notifications()

  // Search.
  const topStartSearch = document.querySelector('.top-start-search')
  if (topStartSearch) {
    document.querySelector('.top-start-search').addEventListener('click', function () {
      const t = document.querySelector('#top_search_concept').getAttribute('data-type')
      let q = ''
      if (t === 'status') {
        q = document.querySelector('#top-search-status').value
      } else {
        q = document.querySelector('#q').value
      }
      gotoSearch(q, t)
    })

    document.querySelectorAll('#top-search-panel li a').forEach(function (link) {
      link.addEventListener('click', function () {
        const type = this.getAttribute('data-type')
        if (type === 'status') {
          document.querySelector('#top-search-status').classList.remove('hidden')
          document.querySelector('#q').style.display = 'none'
          document.querySelector('.top-start-search').style.display = 'none'
        } else {
          document.querySelector('#top-search-status').classList.add('hidden')
          document.querySelector('#q').style.display = 'block'
          document.querySelector('.top-start-search').style.display = 'block'
        }
        document.querySelector('#top_search_concept').setAttribute('data-type', type)
        document.querySelector('#top_search_concept').textContent = this.textContent
      })
    })

    document.querySelector('#q').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        const q = this.value
        const t = document.querySelector('#top_search_concept').getAttribute('data-type')
        gotoSearch(q, t)
      }
    })

    document.querySelector('.top-search-status').addEventListener('change', function () {
      const q = this.value
      const t = document.querySelector('#top_search_concept').getAttribute('data-type')
      gotoSearch(q, t)
    })
  }
})

function gotoSearch (q, t) {
  window.location.href = '/search/?q=' + encodeURIComponent(q) + '&t=' + encodeURIComponent(t)
}
