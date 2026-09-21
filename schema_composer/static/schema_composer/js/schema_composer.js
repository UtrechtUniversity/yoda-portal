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
    language: {
      emptyTable: 'No composed metadata schemas available.'
    }
  })
}

$(function () {
  const alertPanel = $('#alert-panel-schema-delete')

  if ($('#composed-schemas').length) {
    composedschemasTable()
  }

  $('body').on(
    'click',
    '.schema-delete',
    function () {
      const schemaId = $(this).attr('data-schema-id')

      alertPanel.addClass('d-none')
      alertPanel.find('span').text('')

      $('#schema-delete-id').text(schemaId)

      $('.btn-confirm-schema-delete').attr(
        'data-schema-id',
        schemaId
      )
    }
  )

  $('body').on(
    'click',
    '.btn-confirm-schema-delete',
    function () {
      const schemaId = $(this).attr('data-schema-id')
      const $btn = $(this)

      $btn.prop('disabled', true)

      $.ajax({
        url: '/schema_composer/delete/' + encodeURIComponent(schemaId),
        type: 'DELETE',
        data: {
          [Yoda.csrf.tokenName]: Yoda.csrf.tokenValue
        },
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
    }
  )
})

$(document).ready(function () {
  const $available = $('#available-building-blocks')
  const $selected = $('#selected-building-blocks')

  $('#schema-composer-form').on('submit', function (event) {
    const form = this

    if (!form.checkValidity()) {
      event.preventDefault()
      form.classList.add('was-validated')
    }
  })

  let $draggedItem = null
  const isEdit = $selected.data('is-edit')

  function selectBlock ($item) {
    const block = $item.data('block')
    const title = $item.data('block-title')
    const description = $item.data('block-description')

    const $newItem = $(`
      <div class="list-group-item d-flex align-items-center sortable-item"
           draggable="true">
        <span class="drag-handle me-3" title="Drag to reorder">
          <i class="fa-solid fa-grip-vertical"></i>
        </span>
        <span class="flex-grow-1"></span>
        <button type="button"
                class="btn btn-danger remove-building-block">
          Remove
        </button>
        <input type="hidden" name="building_blocks">
      </div>
    `)

    $newItem.attr({
      'data-block': block,
      'data-block-title': title,
      'data-block-description': description,
      'data-existing': 'false'
    })

    $newItem.find('.flex-grow-1')
      .text(title)
      .attr('title', description)

    $newItem.find('input').val(block)

    $selected.append($newItem)
  }

  function restoreBlock ($item) {
    const block = $item.data('block')
    const title = $item.data('block-title')
    const description = $item.data('block-description')

    const $newItem = $(`
      <div class="list-group-item d-flex justify-content-between align-items-center">
        <span class="me-3"></span>
        <button type="button" class="btn btn-primary add-building-block">
          Add
        </button>
      </div>
    `)

    $newItem.attr({
      'data-block': block,
      'data-block-title': title,
      'data-block-description': description
    })

    $newItem.find('.me-3')
      .text(title)
      .attr('title', description)

    $available.append($newItem)
  }

  $available.on('click', '.add-building-block', function () {
    const $item = $(this).closest('.list-group-item')

    selectBlock($item)
    $item.remove()
  })

  $selected.on('click', '.remove-building-block', function () {
    const $item = $(this).closest('.list-group-item')

    if (isEdit && $item.attr('data-existing') === 'true') {
      return
    }

    restoreBlock($item)
    $item.remove()
  })

  /// Drag-and-drop logic https://stackoverflow.com/questions/61370983/how-to-insert-element-before-another-element
  $selected.on('dragstart', '.list-group-item', function () {
    $draggedItem = $(this)
    $draggedItem.addClass('dragging')
  })

  $selected.on('dragend', '.list-group-item', function () {
    $draggedItem.removeClass('dragging')
    $draggedItem = null
  })

  $selected.on('dragover', function (event) {
    event.preventDefault()

    const $item = $(event.target).closest('.list-group-item')

    if (!$item.length || $item[0] === $draggedItem[0]) {
      return
    }

    const item = $item[0].getBoundingClientRect()
    const middle = item.top + item.height / 2

    if (event.originalEvent.clientY < middle) {
      $draggedItem.insertBefore($item)
    } else {
      $draggedItem.insertAfter($item)
    }
  })
})
