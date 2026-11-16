/* global $, Yoda */
'use strict'

$(document).ajaxSend(function (e, request, settings) {
  if (settings.type === 'POST' && settings.data) {
    settings.data += '&' + encodeURIComponent(Yoda.csrf.tokenName) + '=' + encodeURIComponent(Yoda.csrf.tokenValue)
  }
})

function composedschemasTable () {
  $('#composed-schemas').DataTable({
    paging: true,
    searching: true,
    ordering: true,
    order: [[0, 'asc']],
    columnDefs: [
      { orderable: false, targets: [2, 3] }
    ],
    language: { emptyTable: 'No composed metadata schemas available.' }
  })
}

$(function () {
  const alertPanel = $('#alert-panel-schema-delete')

  composedschemasTable()

  $('body').on('click', '.schema-delete', function () {
    const schemaId = $(this).attr('data-schema-id')

    alertPanel.addClass('d-none')

    $('#schema-delete-id').text(schemaId)
    $('.btn-confirm-schema-delete').attr('data-schema-id', schemaId)
  })

  $('body').on('click', '.btn-confirm-schema-delete', function () {
    const schemaId = $(this).attr('data-schema-id')
    const $btn = $(this)

    $btn.prop('disabled', true)

    $.ajax({
      url: '/schema_composer/delete/' + encodeURIComponent(schemaId),
      type: 'DELETE',
      data: { [Yoda.csrf.tokenName]: Yoda.csrf.tokenValue },
      success: function (response) {
        if (response.status === 'ok') {
          window.location.reload()
        } else {
          const message = response.message || 'Failed to delete schema.'

          alertPanel.find('span').text(message)
          alertPanel.removeClass('d-none')
          $btn.prop('disabled', false)
        }
      },
      error: function (xhr) {
        let message = 'An error occurred while deleting the schema.'

        if (xhr.responseJSON && xhr.responseJSON.message) {
          message = xhr.responseJSON.message
        }

        alertPanel.find('span').text(message)
        alertPanel.removeClass('d-none')
        $btn.prop('disabled', false)
      }
    })
  })
})
