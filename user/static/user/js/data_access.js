'use strict'

$(document).ready(function () {
  $('body').on('click', '.delete-token', function (e) {
    const label = $(this).siblings('label').text()
    Yoda.call('token_delete', { label }, { quiet: true }).then(
      (data) => {
        $(this).parent().remove()
      },
      () => {
        Yoda.set_message(
          'error',
          'An error occurred while deleting the data access password. If the issue persists, contact your administrator.')
      })
  })

  $('body').on('click', '#generateButton', function (e) {
    const label = $('#f-token-label').val()

    const button = document.getElementById('generateButton')
    button.setAttribute('hidden', true)

    Yoda.call('token_delete_expired', {}).then(response => {
      return Yoda.call('token_generate', { label }, { quiet: true }).then(
        (data) => {
          $('#f-token').val(data)
          const p = document.getElementById('passwordOk')
          p.removeAttribute('hidden')
        },
        (error) => {
          let errorId = 'passwordGenerateError'
          if (error.status === 'error_TokenExistsError') {
            errorId = 'passwordLabelError'
          }
          const p = document.getElementById(errorId)
          p.removeAttribute('hidden')
          button.removeAttribute('hidden')
        }
      )
    })
  })

  $('.btn-copy-to-clipboard').on('click', function (event) {
    $('#f-token').select()
    document.execCommand('copy')
    event.preventDefault()
  })

  const passwordModal = document.getElementById('dataAccessPassword')
  passwordModal.addEventListener('hidden.bs.modal', function (event) {
    $(this).find('form').trigger('reset')
    window.location.reload()
  })
})
