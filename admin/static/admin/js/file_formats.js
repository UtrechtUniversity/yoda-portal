/* global Option */
'use strict'

document.addEventListener('DOMContentLoaded', function () {
  Yoda.call('vault_preservable_formats_lists').then((data) => {
    const fileFormatsList = document.getElementById('file-formats-list')
    fileFormatsList.innerHTML = "<option value='' disabled selected>Select file format list to delete</option>"

    for (const list in data) {
      if (Object.prototype.hasOwnProperty.call(data, list)) {
        const option = new Option(data[list].name, list)
        fileFormatsList.appendChild(option)
      }
    }
  })

  document.getElementById('upload-button').addEventListener('click', function () {
    document.getElementById('file').click()
  })

  document.getElementById('file').addEventListener('change', function () {
    if (this.files.length > 0) {
      this.form.submit()
    }
  })

  document.getElementById('file-formats-list').addEventListener('change', function () {
    const deleteFormatButton = document.getElementById('delete-format-button')
    deleteFormatButton.disabled = !this.value // Disable if no value is selected
  })
})
