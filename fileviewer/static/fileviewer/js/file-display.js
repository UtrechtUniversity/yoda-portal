'use strict'

$(document).ajaxSend(function (e, request, settings) {
  // Append a CSRF token to all AJAX POST requests.
  if (settings.type === 'POST' && settings.data.length) {
    settings.data +=
             '&' + encodeURIComponent(Yoda.csrf.tokenName) +
              '=' + encodeURIComponent(Yoda.csrf.tokenValue)
  }
})

let currentFile
// Render context menu for files.
const viewExts = {
  image: ['jpg', 'jpeg', 'gif', 'png'],
  audio: ['mp3', 'ogg', 'wav'],
  video: ['mp4', 'ogg', 'webm']
}

function getExtension (filename) {
  const parts = filename.split('.')
  // Only get last extension
  if (parts.length > 1) {
    const extension = parts[parts.length - 1].toLowerCase()
    return extension
  }

  return ''
}

async function getTextObj (currentFileExtension) {
  try {
    const data = await Yoda.call('load_text_obj',
      {
        file_path: Yoda.basePath + currentFile
      })
    let textWithSyntax
    if (data.length && currentFileExtension.length) {
      try {
        textWithSyntax = hljs.highlight(data, { language: currentFileExtension }).value
      } catch (errorHighlighting) {
        // Fallback to not highlighting document
        textWithSyntax = hljs.highlight(data, { language: 'txt' }).value
      }
      $('#file-contents').html(textWithSyntax)
      $('#file-errors').hide()
      $('#file-output').show()
    } else {
      // Empty file
      $('#file-contents').html('')
      $('#file-errors').hide()
      $('#file-output').show()
    }
  } catch (error) {
    $('#file-error-message').html('It was not possible to load this file.')
    // Dismiss stale messages.
    $('#messages .close').trigger('click')
  }
}

$(function () {
  $('#file-output').hide()
  // Extract current location from query string (default to '').
  currentFile = decodeURIComponent((/(?:\?|&)file=([^&]*)/
    .exec(window.location.search) || [0, ''])[1])

  // Canonicalize path somewhat, for convenience.
  currentFile = currentFile.replace(/\/+/g, '/').replace(/\/$/, '')
  const currentFileExtension = getExtension(currentFile)

  if (viewExts.video.includes(currentFileExtension)) {
    // video files
    const viewerHtml = `<div class="ratio ratio-16x9"><video controls autoplay><source src="/research/browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(currentFile))}"></video></div>`
    $('#file-errors').hide()
    $('#file-contents').html(viewerHtml)
    $('#file-output').show()
  } else if (viewExts.image.includes(currentFileExtension)) {
    // image files
    const viewerHtml = `<img class="img-fluid" src="/research/browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(currentFile))}" />`
    $('#file-errors').hide()
    $('#file-contents').html(viewerHtml)
    $('#file-output').show()
  } else if (viewExts.audio.includes(currentFileExtension)) {
    // audio files
    const viewerHtml = `<audio width="640" controls autoplay><source src="/research/browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(currentFile))}"></audio>`
    $('#file-errors').hide()
    $('#file-contents').html(viewerHtml)
    $('#file-output').show()
  } else if (Yoda.textFileExtensions.includes(currentFileExtension)) {
    // text files
    getTextObj(currentFileExtension)
  } else {
    // No supported format
    Yoda.set_message('error', 'This file has no viewable extension.')
    $('#file-error-message').html('It was not possible to load this file.')
    $('#file-output').hide()
    // Dismiss stale messages.
    $('#messages .close').trigger('click')
  }
})
