/* global $ */
'use strict'

$(document).ready(function () {
  const $available = $('#available-building-blocks')
  const $selected = $('#selected-building-blocks')

  $('body').on('click', '.clickable-preview', function () {
    const $item = $(this).closest('.list-group-item')

    window.previewBuildingBlock(
      $item.data('schema'),
      $item.data('block-description')
    )
  })

  $('#schema-composer-form').on('submit', function (event) {
    const form = this
    event.preventDefault()

    if (!form.checkValidity()) {
      form.classList.add('was-validated')
      return
    }

    $('#schema-save-confirm-modal').modal('show')
  })

  $('#confirm-schema-save').on('click', function () {
    document.getElementById('schema-composer-form').submit()
  })

  const isEdit = $selected.data('is-edit')

  function selectBlock ($item) {
    const block = $item.data('block')
    const title = $item.data('block-title')
    const description = $item.data('block-description')
    const schema = $item.data('schema')

    const $newItem = $(`
      <div class="list-group-item d-flex align-items-center sortable-item"
          draggable="true">
        <span class="drag-handle me-3" title="Drag to reorder">
          <i class="fa-solid fa-grip-vertical"></i>
        </span>
        <span class="block-title clickable-preview flex-grow-1 me-2">
          <i class="fa-regular fa-eye me-1"></i>
        </span>
        <button type="button" class="btn btn-danger remove-building-block">
          Remove
        </button>
        <input type="hidden" name="building_blocks">
      </div>
    `)

    $newItem.attr({
      'data-block': block,
      'data-block-title': title,
      'data-block-description': description,
      'data-schema': JSON.stringify(schema),
      'data-existing': 'false'
    })

    $newItem.find('.clickable-preview')
      .append(document.createTextNode(title))
      .attr('title', description)

    $newItem.find('input').val(block)

    $selected.append($newItem)
  }

  function restoreBlock ($item) {
    const block = $item.data('block')
    const title = $item.data('block-title')
    const description = $item.data('block-description')
    const schema = $item.data('schema')

    const $newItem = $(`
      <div class="list-group-item d-flex justify-content-between align-items-center">
        <span class="block-title clickable-preview flex-grow-1 me-2">
          <i class="fa-regular fa-eye me-1"></i>
        </span>
        <button type="button" class="btn btn-primary add-building-block">
          Add
        </button>
      </div>
    `)

    $newItem.attr({
      'data-block': block,
      'data-block-title': title,
      'data-block-description': description,
      'data-schema': JSON.stringify(schema)
    })

    $newItem.find('.clickable-preview')
      .append(document.createTextNode(title))
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
})
