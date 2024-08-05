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
    // Reset error messages.
    const passwordGenerateError = document.getElementById('passwordGenerateError')
    passwordGenerateError.setAttribute('hidden', true)
    const passwordLabelError = document.getElementById('passwordLabelError')
    passwordLabelError.setAttribute('hidden', true)

    const labelInput = document.getElementById('f-token-label')
    const label = document.getElementById('f-token-label').value
    const button = document.getElementById('generateButton')
    const token = document.getElementById('tokenField')
    labelInput.setAttribute('disabled', true)
    button.setAttribute('hidden', true)

    Yoda.call('token_delete_expired', {}).then(response => {
      return Yoda.call('token_generate', { label }, { quiet: true }).then(
        (data) => {
          $('#f-token').val(data)
          const p = document.getElementById('passwordOk')
          p.removeAttribute('hidden')
          token.removeAttribute('hidden')
        },
        (error) => {
          let errorId = 'passwordGenerateError'
          if (error.status === 'error_TokenExistsError') {
            errorId = 'passwordLabelError'
          }
          const p = document.getElementById(errorId)
          p.removeAttribute('hidden')
          button.removeAttribute('hidden')
          token.setAttribute('hidden', true)
          labelInput.removeAttribute('disabled')
        }
      )
    })
  })

  $('.btn-copy-to-clipboard').on('click', function (event) {
    const token = document.getElementById('f-token')
    token.removeAttribute('disabled')
    $('#f-token').select()
    document.execCommand('copy')
    event.preventDefault()
    token.setAttribute('disabled', true)
  })

  const passwordModal = document.getElementById('dataAccessPassword')
  passwordModal.addEventListener('hidden.bs.modal', function (event) {
    $(this).find('form').trigger('reset')
    window.location.reload()
  })

  $('.btn-generate-dap').on('click', function (event) {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = now.toTimeString().split(' ')[0];
    $('#f-token-label').val(`${date} ${time}`);
  });
})
