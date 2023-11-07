/* global browse */
'use strict'

let folderSelectBrowser = null
let dlgCurrentFolder = ''
let currentBrowseFolder = ''

$(document).ready(function () {
  $('body').on('click', 'a.file-copy, a.file-move, a.folder-copy, a.folder-move', function () {
    // Determine action
    if ($(this).hasClass('file-move')) {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'file-move')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Move')
      $('#dlg-file-browse-operations .card-title span.action').text('move')
    } else if ($(this).hasClass('folder-move')) {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'folder-move')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Move')
      $('#dlg-file-browse-operations .card-title span.action').text('move')
    } else if ($(this).hasClass('file-copy')) {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'file-copy')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Copy')
      $('#dlg-file-browse-operations .card-title span.action').text('copy')
    } else {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'folder-copy')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Copy')
      $('#dlg-file-browse-operations .card-title span.action').text('copy')
    }

    // Set filename in modal & button attribute
    $('#dlg-file-browse-operations span.action-file').text($(this).attr('data-name'))
    $('#dlg-file-browse-operations .dlg-action-button').attr('data-name', $(this).attr('data-name'))
    $('#dlg-file-browse-operations .dlg-action-button').attr('data-collection', $(this).attr('data-collection'))

    // Set current folder & initiate browse object.
    dlgCurrentFolder = $(this).attr('data-collection')
    dlgSelectAlertHide()
    startBrowsing2()

    $('#dlg-file-browse-operations').modal('show')
  })

  $('body').on('click', 'a.multiple-copy, a.multiple-move', function () {
    // Determine action
    if ($(this).hasClass('multiple-move')) {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'multiple-move')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Move item(s)')
      $('#dlg-file-browse-operations .card-title span.action').text('move')
      $('#mutli-select-progress').attr('data-action', 'move')
    } else {
      $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'multiple-copy')
      $('#dlg-file-browse-operations .dlg-action-button span.action').text('Copy item(s)')
      $('#dlg-file-browse-operations .card-title span.action').text('copy')
      $('#mutli-select-progress').attr('data-action', 'copy')
    }

    // Set filename in modal & button attribute
    $('#dlg-file-browse-operations span.action-file').text('selected item(s)')

    // Set current folder & initiate browse object.
    currentBrowseFolder = $('.system-metadata-icon').attr('data-folder')
    dlgCurrentFolder = currentBrowseFolder
    dlgSelectAlertHide()
    startBrowsing2()

    $('#dlg-file-browse-operations').modal('show')
  })

  $('body').on('click', 'a.multiple-delete', function () {
    $('#multi-select-delete .collection').text($('.system-metadata-icon').attr('data-folder'))
    $('#mutli-select-progress').attr('data-action', 'delete')
    $('#multi-select-delete').modal('show')
  })
  // handling of breadcrumbs
  $('body').on('click', '.browse-select', function (e) {
    dlgBrowse($(this).attr('data-path'))
    e.preventDefault()
  })

  $('body').on('click', '.dlg-browse', function (e) {
    dlgBrowse($(this).attr('data-path'))

    // Dismiss stale messages.
    e.preventDefault()
  })

  $('.dlg-action-button').on('click', function () {
    const action = $(this).attr('data-action')
    const overwrite = $(this).attr('data-overwrite')
    // Single file
    if (action === 'file-move' || action === 'file-copy' || action === 'folder-move' || action === 'folder-copy') {
      const path = $(this).attr('data-collection') + '/' + $(this).attr('data-name')
      const newPath = dlgCurrentFolder + '/' + $(this).attr('data-name')

      if (action === 'file-move') {
        moveFile(path, newPath, false, null, overwrite)
      } else if (action === 'file-copy') {
        copyFile(path, newPath, false, null, overwrite)
      } else if (action === 'folder-move') {
        if ($('#dlg-file-browse-operations .dlg-action-button span.action').text() === 'Move and Overwrite') {
          overwriteFolder(path, newPath, false, action)
        } else {
          moveFolder(path, newPath, false)
        }
      } else if (action === 'folder-copy') {
        if ($('#dlg-file-browse-operations .dlg-action-button span.action').text() === 'Copy and Overwrite') {
          overwriteFolder(path, newPath, false, action)
        } else {
          copyFolder(path, newPath, false)
        }
      }
    } else {
      // Multiple items
      $('.multi-select-table tbody').html('')
      $("input:checkbox[name='multiSelect[]']:checked").each(function (index) {
        const type = $(this).attr('data-type')
        const name = $(this).attr('data-name')
        let icon
        if (type === 'coll') {
          icon = '<i class="fa-regular fa-folder"></i>'
        } else {
          icon = '<i class="fa-regular fa-file"></i>'
        }

        const row = `<tr class="row-${index}">
                    <td>${icon} ${name}</td>
                    <td class="item-progress">-</td>
                </tr>
                `
        $('.multi-select-table tbody').append(row)
      })

      if (action === 'multiple-delete') {
        $('#multi-select-delete').modal('hide')
      } else {
        $('#dlg-file-browse-operations').modal('hide')
      }
      $('#mutli-select-progress').modal('show')
    }
  })

  $('#mutli-select-progress').on('show.bs.modal', function (e) {
    // Get action (move or copy)
    const action = $('#mutli-select-progress').attr('data-action')

    $("input:checkbox[name='multiSelect[]']:checked").each(function (index) {
      const type = $(this).attr('data-type')
      const name = $(this).attr('data-name')
      const currentPath = $(this).val()
      let collection
      let newPath
      if (action === 'delete') {
        collection = $('.system-metadata-icon').attr('data-folder')
      } else {
        newPath = dlgCurrentFolder + '/' + name
      }

      if (type === 'data') {
        if (action === 'copy') {
          copyFile(currentPath, newPath, true, index)
        } else if (action === 'move') {
          moveFile(currentPath, newPath, true, index)
        } else if (action === 'delete') {
          deleteFile(collection, name, index)
        }
      } else {
        if (action === 'copy') {
          copyFolder(currentPath, newPath, true, index)
        } else if (action === 'move') {
          moveFolder(currentPath, newPath, true, index)
        } else if (action === 'delete') {
          deleteFolder(collection, name, index)
        }
      }
    })
  })

  $('#finishMultiSelect').on('click', function () {
    $("input:checkbox[id='multi-select-all']").prop('checked', false)
  })
})

$(document).on('click', '.multi-overwrite-button', function () {
  const action = $(this).attr('data-action')
  const type = $(this).attr('data-type')
  const name = $(this).attr('data-name')
  const currentPath = $(this).attr('data-collection') + '/' + name
  const index = $(this).closest('tr').attr('class').split('-').pop()
  let newPath

  newPath = dlgCurrentFolder + '/' + name

  console.log(action)
  console.log(type)
  console.log(name)
  console.log(currentPath)
  console.log(index)
  console.log(newPath)

  if (type === 'data') {
    copyFile(currentPath, newPath, true, index, true)
  } else {
    overwriteFolder(currentPath, newPath, true, action, index)
  }
})

$(document).on('click', '.multi-cancel-button', function () {
  const action = $(this).attr('data-action')
  const type = $(this).attr('data-type')
  const name = $(this).attr('data-name')
  const currentPath = $(this).attr('data-collection') + '/' + name
  const index = $(this).closest('tr').attr('class').split('-').pop()

  $('.multi-select-table tr.row-' + index + ' td.item-progress').text('Overwrite cancelled')
  if (($('#mutli-select-progress .dlg-action-button span.action').text() === 'Copy and Overwrite All') || ($('#mutli-select-progress .dlg-action-button span.action').text() === 'Move and Overwrite All')) {
    $('#mutli-select-progress .dlg-action-button').prop('disabled', true)
  }
})

async function copyFile (filepath, newFilepath, multiple, multipleIndex = null, overwrite = false) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Copying <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }
  $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Copy</span>')

  try {
    const result = await Yoda.call('research_file_copy',
      {
        filepath: Yoda.basePath + filepath,
        new_filepath: Yoda.basePath + newFilepath,
        overwrite
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Copy completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The file has been successfully copied.')
        $('#dlg-file-browse-operations').modal('hide')
      }
    } else { // non api error
      if (multiple) {
        if (result.status_info.includes('already exists')) {
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info + '. Do you want to overwrite?')
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').append('<button type="button" class="btn btn-primary ms-2 multi-overwrite-button" data-type="data" data-name="' +
          $('.multi-select-table tr.row-' + multipleIndex).find('td:first').text().trim() +
          '" data-action="copy" data-collection="' +
          filepath.substring(0, filepath.lastIndexOf('/')) +
          '">Yes</button>' +
          '<button type="button" class="btn btn-primary ms-2 multi-cancel-button" data-type="data" data-name="' +
          $('.multi-select-table tr.row-' + multipleIndex).find('td:first').text().trim() +
          '" data-action="copy" data-collection="' +
          filepath.substring(0, filepath.lastIndexOf('/')) +
          '">No</button>')

          $('#mutli-select-progress .dlg-action-button').html('<span class="action">Copy and Overwrite All</span>')
          $('#mutli-select-progress .dlg-action-button').attr('data-action', 'copy')
          $('#mutli-select-progress .dlg-action-button').removeClass('hidden')
        } else {
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
        }
      } else {
        if (result.status_info.includes('already exists')) {
          dlgSelectAlertShow(result.status_info + '. Do you want to overwrite?')
          $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Copy and overwrite</span>')
          $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'file-copy')
          $('#dlg-file-browse-operations .dlg-action-button').attr('data-overwrite', true)
        } else {
          dlgSelectAlertShow(result.status_info)
        }
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
}

async function moveFile (filepath, newFilepath, multiple, multipleIndex = null, overwrite = false) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Moving <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }
  $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Move</span>')
  try {
    const result = await Yoda.call('research_file_move',
      {
        filepath: Yoda.basePath + filepath,
        new_filepath: Yoda.basePath + newFilepath
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Move completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The file has been successfully moved.')
        $('#dlg-file-browse-operations').modal('hide')
        const collection = $('#dlg-file-browse-operations .dlg-action-button').attr('data-collection')
        browse(collection, true)
      }
    } else { // non api error
      if (multiple) {
        if (result.status_info.includes('already exists')) {
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info + '. Do you want to overwrite?')
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').append('<button type="button" class="btn btn-primary ms-2 multi-overwrite-button" data-type="data" data-name="' +
          $('.multi-select-table tr.row-' + multipleIndex).find('td:first').text().trim() +
          '" data-action="move" data-collection="' +
          filepath.substring(0, filepath.lastIndexOf('/')) +
          '">Yes</button>' +
          '<button type="button" class="btn btn-primary ms-2 multi-cancel-button" data-type="data" data-name="' +
          $('.multi-select-table tr.row-' + multipleIndex).find('td:first').text().trim() +
          '" data-action="move" data-collection="' +
          filepath.substring(0, filepath.lastIndexOf('/')) +
          '">No</button>')

          $('#mutli-select-progress .dlg-action-button').html('<span class="action">Move and Overwrite All</span>')
          $('#mutli-select-progress .dlg-action-button').attr('data-action', 'move')
          $('#mutli-select-progress .dlg-action-button').removeClass('hidden')
        } else {
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
        }
      } else {
        if (result.status_info.includes('already exists')) {
          dlgSelectAlertShow(result.status_info + '. Do you want to overwrite?')
          $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Move and overwrite</span>')
          $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'file-move')
          $('#dlg-file-browse-operations .dlg-action-button').attr('data-overwrite', true)
        } else {
          dlgSelectAlertShow(result.status_info)
        }
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
}

async function copyFolder (folderPath, newFolderpath, multiple, multipleIndex = null) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Copying <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }
  $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Copy</span>')
  try {
    const result = await Yoda.call('research_folder_copy',
      {
        folder_path: Yoda.basePath + folderPath,
        new_folder_path: Yoda.basePath + newFolderpath
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Copy completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The folder has been successfully copied.')
        $('#dlg-file-browse-operations').modal('hide')
      }
    } else { // non api error
      if (multiple) {
        if (result.status_info.includes('already exists')) {
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info + '. Do you want to overwrite?')
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').append('<button type="button" class="btn btn-primary ms-2 multi-overwrite-button" data-type="coll" data-name="' +
          $('.multi-select-table tr.row-' + multipleIndex).find('td:first').text().trim() +
          '" data-action="copy" data-collection="' +
          folderPath.substring(0, folderPath.lastIndexOf('/')) +
          '">Yes</button>' +
          '<button type="button" class="btn btn-primary ms-2 multi-cancel-button" data-type="coll" data-name="' +
          $('.multi-select-table tr.row-' + multipleIndex).find('td:first').text().trim() +
          '" data-action="copy" data-collection="' +
          folderPath.substring(0, folderPath.lastIndexOf('/')) +
          '">No</button>')

          $('#mutli-select-progress .dlg-action-button').html('<span class="action">Copy and Overwrite All</span>')
          $('#mutli-select-progress .dlg-action-button').attr('data-action', 'copy')
          $('#mutli-select-progress .dlg-action-button').removeClass('hidden')
        } else {
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
        }
      } else {
        if (result.status_info.includes('already exists')) {
          dlgSelectAlertShow(result.status_info + '. Do you want to overwrite?')
          $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Copy and Overwrite</span>')
          $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'folder-copy')
        } else {
          dlgSelectAlertShow(result.status_info)
        }
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
}

async function moveFolder (folderPath, newFolderpath, multiple, multipleIndex = null) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Moving <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }
  $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Move</span>')
  try {
    const result = await Yoda.call('research_folder_move',
      {
        folder_path: Yoda.basePath + folderPath,
        new_folder_path: Yoda.basePath + newFolderpath
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Move completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The folder has been successfully moved.')
        $('#dlg-file-browse-operations').modal('hide')
        const collection = $('#dlg-file-browse-operations .dlg-action-button').attr('data-collection')
        browse(collection, true)
      }
    } else { // non api error
      if (multiple) {
        if (result.status_info.includes('already exists')) {
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info + '. Do you want to overwrite?')
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').append('<button type="button" class="btn btn-primary ms-2 multi-overwrite-button" data-type="coll" data-name="' +
          $('.multi-select-table tr.row-' + multipleIndex).find('td:first').text().trim() +
          '" data-action="move" data-collection="' +
          folderPath.substring(0, folderPath.lastIndexOf('/')) +
          '">Yes</button>' +
          '<button type="button" class="btn btn-primary ms-2 multi-cancel-button" data-type="coll" data-name="' +
          $('.multi-select-table tr.row-' + multipleIndex).find('td:first').text().trim() +
          '" data-action="move" data-collection="' +
          folderPath.substring(0, folderPath.lastIndexOf('/')) +
          '">No</button>')

          $('#mutli-select-progress .dlg-action-button').html('<span class="action">Move and Overwrite All</span>')
          $('#mutli-select-progress .dlg-action-button').attr('data-action', 'move')
          $('#mutli-select-progress .dlg-action-button').removeClass('hidden')
        } else {
          $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
        }
      } else {
        if (result.status_info.includes('already exists')) {
          dlgSelectAlertShow(result.status_info + '. Do you want to overwrite?') // Change button to move and overwrite
          $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Move and Overwrite</span>')
          $('#dlg-file-browse-operations .dlg-action-button').attr('data-action', 'folder-move')
        } else {
          dlgSelectAlertShow(result.status_info)
        }
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
}
async function deleteFolder (collection, folderName, multipleIndex = null) {
  $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')

  try {
    const result = await Yoda.call('research_folder_delete',
      {
        coll: Yoda.basePath + collection,
        folder_name: folderName
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Delete completed')
      browse(collection, true)
    } else { // non api error
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
    }
  } catch (e) { // API ERROR
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
  }
}

async function deleteFile (collection, fileName, multipleIndex = null) {
  $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')

  try {
    const result = await Yoda.call('research_file_delete',
      {
        coll: Yoda.basePath + collection,
        file_name: fileName
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Delete completed')
      browse(collection, true)
    } else { // non api error
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
    }
  } catch (e) { // API ERROR
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
  }
}

async function overwriteFolder (folderPath, newFolderPath, multiple, action, multipleIndex = null) {
  if (multiple) {
    $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').html('<i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  } else {
    dlgSelectAlertHide()
    $('#dlg-file-browse-operations .dlg-action-button').html('Overwriting <i class="fa-solid fa-spinner fa-spin fa-fw"></i>')
  }

  try {
    const result = await Yoda.call('research_overwrite_folder',
      {
        folder_path: Yoda.basePath + folderPath,
        new_folder_path: Yoda.basePath + newFolderPath,
        action
      },
      { quiet: true, rawResult: true }
    )

    if (result.status === 'ok') {
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text('Overwrite completed')
        browse(currentBrowseFolder, true)
      } else {
        Yoda.set_message('success', 'The folder has been successfully overwritten.')
        $('#dlg-file-browse-operations').modal('hide')
      }
    } else { // non api error
      if (multiple) {
        $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(result.status_info)
      } else {
        dlgSelectAlertShow(result.status_info)
      }
    }
  } catch (e) { // API ERROR
    if (multiple) {
      $('.multi-select-table tr.row-' + multipleIndex + ' td.item-progress').text(dlgSelectAlertShow(e.status_info))
    } else {
      dlgSelectAlertShow(e.status_info)
    }
  }
  if (action === 'folder-copy' || action === 'copy') {
    $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Copy</span>')
  } else {
    $('#dlg-file-browse-operations .dlg-action-button').html('<span class="action">Move</span>')
  }
}

function startBrowsing2 () {
  if (!folderSelectBrowser) {
    folderSelectBrowser = $('#folder-select-browser').DataTable({
      bFilter: false,
      bInfo: false,
      bLengthChange: true,
      language: {
        emptyTable: 'No accessible files/folders present',
        lengthMenu: '_MENU_'
      },
      dom: '<"top">frt<"bottom"lp><"clear">',
      columns: [{ render: tableRenderer2.name, data: 'name' },
        // Size and date should be orderable, but limitations
        // on how queries work prevent us from doing this
        // correctly without significant overhead.
        // (enabling this as is may result in duplicated results for data objects)
        // {render: tableRenderer.size,    orderable: false, data: 'size'},
        { render: tableRenderer2.date, orderable: false, data: 'modify_time' }],
      // {render: tableRenderer.context, orderable: false }],
      ajax: getFolderContents2,
      processing: true,
      serverSide: true,
      iDeferLoading: 0,
      pageLength: parseInt(Yoda.storage.session.get('pageLength') === null ? Yoda.settings.number_of_items : Yoda.storage.session.get('pageLength'))
    })
    $('#folder-select-browser').on('length.dt', function (e, settings, len) {
      Yoda.storage.session.set('pageLength', len)
    })
  }
  dlgBrowse(dlgCurrentFolder)
}

// Fetches directory contents to populate the listing table.
const getFolderContents2 = (() => {
  // Close over some state variables.
  // -> we keep a multi-page cache handy, since getting only $page_length [=10]
  //    results each time is wasteful and slow.
  // A change in sort column/order or folder will invalidate the cache.

  // The amount of rows to request at once.
  // *Must* be equal to or greater than the largest datatables page length,
  // and *should* be smaller than iRODS SQL rows per batch.
  const batchSize = 200
  // (~140 B per entry in JSON returned by iRODS,
  //  so depending on name = up to 28K to transfer for each fetch)

  let total = false // Total subcollections / data objects.
  let cache = [] // Cached result rows (may be more than shown on one page).
  let cacheStart = null // Row number of the first cache entry.
  let cacheFolder = null // Folder path of the cache.
  let cacheSortCol = null // Cached sort column nr.
  let cacheSortOrder = null // Cached sort order.
  let i = 0 // Keep simultaneous requests from interfering.

  const get = async (args) => {
    // Check if we can use the cache.
    if (cache.length &&
            dlgCurrentFolder === cacheFolder &&
            args.order[0].dir === cacheSortOrder &&
            args.order[0].column === cacheSortCol &&
            args.start >= cacheStart &&
            args.start + args.length <= cacheStart + batchSize) {
      return cache.slice(args.start - cacheStart, args.start - cacheStart + args.length)
    } else {
      // Nope, load new data via the API.
      const j = ++i

      // + currentFolder
      const result = await Yoda.call('browse_folder',
        {
          coll: Yoda.basePath + dlgCurrentFolder,
          offset: args.start,
          limit: batchSize,
          sort_order: args.order[0].dir,
          sort_on: ['name', 'size', 'modified'][args.order[0].column],
          space: 'Space.RESEARCH'
        })

      // If another requests has come while we were waiting, simply drop this one.
      if (i !== j) return null

      // Populate the 'size' of collections so datatables doesn't get confused.
      for (const x of result.items) {
        if (x.type === 'coll') { x.size = 0 }
      }

      // Update cache info.
      total = result.total
      cacheStart = args.start
      cache = result.items
      cacheFolder = dlgCurrentFolder
      cacheSortCol = args.order[0].column
      cacheSortOrder = args.order[0].dir

      return cache.slice(args.start - cacheStart, args.length)
    }
  }

  // The actual function passed to datatables.
  // (needs a non-async wrapper cause datatables won't accept it otherwise)
  const fn = (args, cb, settings) => (async () => {
    const data = await get(args)
    if (data === null) { return }

    const callback = {
      data,
      recordsTotal: total,
      recordsFiltered: total
    }
    cb(callback)
  })()

  // Allow manually clearing results (needed during soft-reload after uploading a file).
  fn.dropCache = () => { cache = [] }
  return fn
})()

const tableRenderer2 = {
  name: (name, _, row) => {
    const tgt = `${dlgCurrentFolder}/${name}`
    if (row.type === 'coll') { return `<a class="coll dlg-browse" href="?dir=${encodeURIComponent(tgt)}" data-path="${Yoda.htmlEncode(tgt)}"><i class="fa-regular fa-folder"></i> ${Yoda.htmlEncode(name)}</a>` } else { return `<i class="fa-regular fa-file"></i> ${Yoda.htmlEncode(name)}` }
  },
  size: (size, _, row) => {
    if (row.type === 'coll') {
      return ''
    } else {
      const szs = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']
      let szi = 0
      while (size >= 1024 && szi < szs.length - 1) {
        size /= 1024
        szi++
      }
      return (Math.floor(size * 10) / 10 + '') + '&nbsp;' + szs[szi]
    }
  },
  date: ts => {
    const date = new Date(ts * 1000)
    const pad = n => n < 10 ? '0' + n : '' + n
    const elem = $('<span>')
    elem.text(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
            ` ${pad(date.getHours())}:${pad(date.getMinutes())}`)
    elem.attr('title', date.toString()) // (should include seconds and TZ info)
    return elem[0].outerHTML
  },
  context: (_, __, row) => {
    if (row.type === 'coll') { return '' }

    // Render context menu for files.
    const viewExts = {
      image: ['jpg', 'jpeg', 'gif', 'png'],
      audio: ['mp3', 'ogg', 'wav'],
      video: ['mp4', 'ogg', 'webm']
    }
    const ext = row.name.replace(/.*\./, '').toLowerCase()

    const actions = $('<ul class="dropdown-menu">')
    actions.append(`<li><a href="browse/download?filepath=${encodeURIComponent(dlgCurrentFolder + '/' + row.name)}">Download</a>`)

    // Generate dropdown "view" actions for different media types.
    for (const type of Object.keys(viewExts).filter(type => (viewExts[type].includes(ext)))) { actions.append(`<li><a class="view-${type}" data-path="${Yoda.htmlEncode(dlgCurrentFolder + '/' + row.name)}">View</a>`) }

    const dropdown = $(`<div class="dropdown">
                                <span class="dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                  <span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span>
                                </span>`)
    dropdown.append(actions)

    return dropdown[0].outerHTML
  }
}

function dlgBrowse (dir) {
  dir = decodeURIComponent(dir)
  dlgCurrentFolder = dir

  dlgSelectAlertHide()

  dlgMakeBreadcrumb(dir)

  dlgBuildFileBrowser(dir)
}

function dlgBuildFileBrowser (dir) {
  getFolderContents2.dropCache()
  folderSelectBrowser.ajax.reload()
}

function dlgMakeBreadcrumb (urlEncodedDir) {
  const dir = urlEncodedDir

  let parts = []
  if (typeof dir !== 'undefined') {
    if (dir.length > 0) {
      const elements = dir.split('/')

      // Remove empty elements
      parts = $.map(elements, function (v) {
        return v === '' ? null : v
      })
    }
  }

  // Build html
  const totalParts = parts.length

  let html = '<li class="active">Research</li>'
  if (totalParts > 0 && parts[0] !== 'undefined') {
    html = '<li class="browse-select breadcrumb-item" data-path="">Research</li>'
    let path = ''
    $.each(parts, function (k, part) {
      path += '/' + encodeURIComponent(part)

      // Active item
      const valueString = Yoda.htmlEncode(part).replace(/ /g, '&nbsp;')
      if (k === (totalParts - 1)) {
        html += '<li class="active breadcrumb-item">' + valueString + '</li>'
      } else {
        html += '<li class="browse-select breadcrumb-item" data-path="' + path + '">' + valueString + '</li>'
      }
    })
  }

  $('ol.dlg-breadcrumb').html(html)
}

/// alert handling
function dlgSelectAlertShow (errorMessage) {
  $('#dlg-select-alert-panel').removeClass('hide')
  $('#dlg-select-alert-panel span').html(errorMessage)
}

function dlgSelectAlertHide () {
  $('#dlg-select-alert-panel').addClass('hide')
}
