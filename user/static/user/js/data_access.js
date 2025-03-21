'use strict'

document.addEventListener('DOMContentLoaded', function () {
  Yoda.call('token_load').then((data) => {
    const container = document.getElementById('tokens')

    data.forEach(token => {
      const div = document.createElement('div')
      div.className = 'list-group-item d-inline-flex'
      div.innerHTML = `
            <label class="col-sm-7">${token.label}</label>
            <span class="col-sm-3">${token.exp_time}</span>
            <button type="button" class="btn btn-danger col-sm-2 delete-token">Delete</button>
        `
      container.appendChild(div)
    })
  })

  document.body.addEventListener('click', function (e) {
    if (e.target.classList.contains('delete-token')) {
      const tokenItem = e.target.closest('.list-group-item')
      const label = tokenItem.querySelector('label').textContent
      Yoda.call('token_delete', { label }, { quiet: true }).then(
        (data) => {
          e.target.parentElement.remove()
        },
        () => {
          Yoda.set_message(
            'error',
            'An error occurred while deleting the data access password. If the issue persists, contact your administrator.'
          )
        }
      )
    }

    if (e.target.id === 'generateButton') {
      // Reset error messages.
      const passwordGenerateError = document.getElementById('passwordGenerateError')
      passwordGenerateError.setAttribute('hidden', true)
      const passwordLabelError = document.getElementById('passwordLabelError')
      passwordLabelError.setAttribute('hidden', true)

      const labelInput = document.getElementById('f-token-label')
      const label = labelInput.value
      const button = document.getElementById('generateButton')
      const token = document.getElementById('tokenField')
      labelInput.setAttribute('disabled', true)
      button.setAttribute('hidden', true)

      Yoda.call('token_delete_expired', {}).then(response => {
        return Yoda.call('token_generate', { label }, { quiet: true }).then(
          (data) => {
            document.getElementById('f-token').value = data
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
    }

    if (e.target.classList.contains('btn-copy-to-clipboard')) {
      const token = document.getElementById('f-token')
      token.removeAttribute('disabled')
      token.select()
      document.execCommand('copy')
      e.preventDefault()
      token.setAttribute('disabled', true)
    }

    if (e.target.classList.contains('btn-generate-dap')) {
      const now = new Date()
      const date = now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
      const time = now.toTimeString().split(' ')[0]
      document.getElementById('f-token-label').value = `${date} ${time}`
    }
  })

  const passwordModal = document.getElementById('dataAccessPassword')
  passwordModal.addEventListener('hidden.bs.modal', function (event) {
    this.querySelector('form').reset()
    window.location.reload()
  })
})
