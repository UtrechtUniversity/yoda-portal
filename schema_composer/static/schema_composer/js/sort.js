/* global $ */
'use strict'

/// Drag-and-drop logic https://stackoverflow.com/questions/61370983/how-to-insert-element-before-another-element
$(document).ready(function () {
  const $selected = $('#selected-building-blocks')
  let $draggedItem = null

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
