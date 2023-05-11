/* global path */
'use strict'

$(document).ajaxSend(function (e, request, settings) {
  // Append a CSRF token to all AJAX POST requests.
  if (settings.type === 'POST' && settings.data.length) {
    settings.data +=
             '&' + encodeURIComponent(Yoda.csrf.tokenName) +
              '=' + encodeURIComponent(Yoda.csrf.tokenValue)
  }
})

$(function () {
  submitStatus()

  $('body').on('click', 'button#submit', function () {
    submitToVault()
  })
})

async function submitStatus () {
  const status = await getStatus()
  if (status) {
    $('#submit').prop('disabled', false)
  } else {
    $('#submit').prop('disabled', true)
  }
}

async function getStatus () {
  try {
    const status = await Yoda.call('deposit_status', { path })
    if (status.data) {
      // Retrieve system metadata of folder.
      Yoda.call('research_system_metadata', { coll: Yoda.basePath + path }).then((data) => {
        $('.package-size').text(data['Package size'])
      })
      $('#data_check').removeClass('fa-times text-danger').addClass('fa-check text-success')
    } else {
      $('#data_check').removeClass('fa-check text-success').addClass('fa-times text-danger')
    }
    if (status.metadata) {
      $('#metadata_check').removeClass('fa-times text-danger').addClass('fa-check text-success')
    } else {
      $('#metadata_check').removeClass('fa-check text-success').addClass('fa-times text-danger')
    }

    if (status.data && status.metadata) {
      return true
    } else {
      return false
    }
  } catch (e) {
    console.log(e)
    return false
  }
}

async function submitToVault () {
  try {
    const result = await Yoda.call('deposit_submit', { path },
      { rawResult: true }
    )
    if (result.status === 'ok') {
      window.location.href = '/deposit/thank-you'
    }
  } catch (e) {
    console.log(e)
  }
}
