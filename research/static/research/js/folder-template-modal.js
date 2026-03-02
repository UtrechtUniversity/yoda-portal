/* global $, currentFolder, browse */
'use strict'

function handleFolderTemplateModal () {
  // Create folder structure from file
  document.getElementById('file-input-click').addEventListener('click', async function (event) {
    event.preventDefault()

    const errorNode = document.querySelector('#error-folder-template')

    const formData = new FormData()
    formData.append(Yoda.csrf.tokenName, Yoda.csrf.tokenValue)

    // Upload file
    const fileInput = document.getElementById('file-input')
    if (fileInput && fileInput.files[0]) {
      const file = fileInput.files[0]

      if (file.name.split('.').pop() !== 'txt') {
        errorNode.innerHTML =
        '<p>Error: file is not a text file!</p>'
        return
      }

      formData.append('file', file)
    } else {
      errorNode.innerHTML =
        '<p>Error: no file selected!</p>'
      return
    }

    // Show user that folder structure file is being processed
    const btn = this
    const spinner = btn.querySelector('.spinner-border')
    const statusText = btn.querySelector('[role="status"]')

    btn.disabled = true
    spinner.style.display = 'inline-block'
    statusText.textContent = 'Creating folder structure'

    // Handle response
    try {
      const response = await fetch('upload_folder_template', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
        redirect: 'manual'
      })

      const jsonResponse = await response.json()

      if (response.status === 200) {
        $('#upload-template-modal').modal('hide')
        $('#folder-template-progress').modal('show')
        $('.folder-template-table tbody').html('')

        jsonResponse.responses.forEach(function (response, index) {
          const icon = '<i class="fa-regular fa-folder"></i>'
          const folder = response.folder
          let progress

          if (response.status === 'ok') {
            progress = 'Folder created'
          } else {
            progress = response.status_info
          }

          const row = `<tr class="row-${index}">
                      <td><p>${icon} ${folder}</p></td>
                      <td class="item-progress"><p>${progress}</p></td>
                  </tr>
                  `
          $('.folder-template-table tbody').append(row)
        })
      } else {
        let errorMsg = '<p>Something went wrong while processing the file'
        if ('errors' in jsonResponse) {
          errorMsg += ': </p><ul>'
          jsonResponse.errors.forEach(function (error) {
            errorMsg += `<li>${error}</li>`
          })
          errorMsg += '</ul>'
        } else {
          errorMsg += '.</p>'
        }
        errorNode.innerHTML = errorMsg
      }
    } catch (error) {
      console.error('Folder structure creation failed: ', error)
      errorNode.innerHTML =
        '<p>Error when creating the folder structure.</p>'
    } finally {
      btn.disabled = false
      spinner.style.display = 'none'
      statusText.innerHTML = '<span role="status"><i class="fa-solid fa-upload" aria-hidden="true"></i> Upload file</span>'
      browse(currentFolder, true)
    }
  })

  // Clear modal on closure
  document.getElementById('upload-template-modal').addEventListener('hidden.bs.modal', event => {
    const resultNode = document.querySelector('#error-folder-template')
    resultNode.innerHTML = ''

    const fileInput = document.getElementById('file-input')
    fileInput.value = ''
  })
}

document.addEventListener('DOMContentLoaded', handleFolderTemplateModal())
