/* global Option */
'use strict'

$(function () {
  Yoda.call('vault_preservable_formats_lists').then((data) => {
    $('#file-formats-list').html("<option value='' disabled selected>Select a file format list</option>")
    for (const list in data) {
      if (Object.prototype.hasOwnProperty.call(data, list)) {
        $('#file-formats-list').append(new Option(data[list].name, list))
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

  $('#file-formats-list').on('change', function () {
    if ($(this).val()) {
      $('#delete-format-button').prop('disabled', false)
    } else {
      $('#delete-format-button').prop('disabled', true)
    }
  })
})
