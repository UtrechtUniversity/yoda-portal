/* global DOMPurify */
'use strict'

document.addEventListener('DOMContentLoaded', () => {
  const sortOrder = new URLSearchParams(window.location.search).get('sort_order') || 'desc'

  Yoda.call('notifications_load', { sort_order: sortOrder }).then((data) => {
    const notificationContainer = document.getElementById('notifications')
    const notificationTools = document.getElementById('notification-tools')
    let notificationHtml = ''

    if (data && data.length > 0) {
      notificationTools.classList.remove('hidden')
      notificationHtml = data.map(notification => `
        <a href="${notification.link || '#'}" class="list-group-item list-group-item-action">
          <div class="d-flex w-100 justify-content-between">
            <p class="mb-1">${notification.message}</p>
            <small class="text-muted">${notification.datetime}</small>
          </div>
          ${notification.actor ? `<small class="float-start me-2"><i class="fa-solid fa-user" aria-hidden="true"></i> ${notification.actor}</small>` : ''}
          ${notification.data_package ? `<small class="float-start"><i class="fa-solid fa-box-archive" aria-hidden="true"></i> ${notification.data_package}</small>` : ''}
          <h5 class="dismiss-notification float-end" data-id="${notification.identifier}" title="Done"><i class="fa-solid fa-check" aria-hidden="true"></i></h5>
        </a>
      `).join('')
    } else {
      notificationHtml = '<p>All caught up! You have no new notifications.</p>'
    }
    notificationContainer.innerHTML = DOMPurify.sanitize(notificationHtml)
  })

  document.body.addEventListener('click', (e) => {
    const target = e.target

    // Handle dismiss notification for individual items
    if (target.matches('a.list-group-item > h5.dismiss-notification > i.fa-solid.fa-check')) {
      e.preventDefault()
      const identifier = target.closest('h5.dismiss-notification').getAttribute('data-id')
      target.closest('a.list-group-item')?.remove()
      Yoda.call('notifications_dismiss', { identifier }).then(() => {
        if (!document.querySelectorAll('a.list-group-item > h5.dismiss-notification').length) {
          window.location.reload()
        }
      })
    }

    // Handle dismiss all notifications.
    if (target.matches('button#notifications_dismiss_all')) {
      e.preventDefault()
      Yoda.call('notifications_dismiss_all', {}).then(() => window.location.reload())
    }
  })
})
