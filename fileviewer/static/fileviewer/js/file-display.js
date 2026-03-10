/* global hljs */
'use strict'

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
    const response = await Yoda.call('load_text_obj', {
      file_path: Yoda.basePath + currentFile
    })

    let textWithSyntax
    if (response.length && currentFileExtension.length) {
      try {
        textWithSyntax = hljs.highlight(response, { language: currentFileExtension }).value
      } catch (errorHighlighting) {
        // Fallback to not highlighting document
        textWithSyntax = hljs.highlight(response, { language: 'txt' }).value
      }
      document.getElementById('file-contents').innerHTML = textWithSyntax
      document.getElementById('file-errors').style.display = 'none'
      document.getElementById('file-output').style.display = 'block'
    } else {
      // Empty file
      document.getElementById('file-contents').innerHTML = ''
      document.getElementById('file-errors').style.display = 'none'
      document.getElementById('file-output').style.display = 'block'
    }
  } catch (error) {
    document.getElementById('file-error-message').innerHTML = 'It was not possible to load this file.'
    // Dismiss stale messages.
    const closeButtons = document.querySelectorAll('#messages .close')
    closeButtons.forEach(button => button.click())
  }
}

window.addEventListener('load', function () {
  document.getElementById('file-output').style.display = 'none'

  // Extract current location from query string (default to '').
  currentFile = decodeURIComponent((/(?:\?|&)file=([^&]*)/
    .exec(window.location.search) || [0, ''])[1])

  // Canonicalize path somewhat, for convenience.
  currentFile = currentFile.replace(/\/+/g, '/').replace(/\/$/, '')
  const currentFileExtension = getExtension(currentFile)

  if (viewExts.video.includes(currentFileExtension)) {
    // video files
    const viewerHtml = `<div class="ratio ratio-16x9"><video controls autoplay><source src="/browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(currentFile))}"></video></div>`
    document.getElementById('file-errors').style.display = 'none'
    document.getElementById('file-contents').innerHTML = viewerHtml
    document.getElementById('file-output').style.display = 'block'
  } else if (viewExts.image.includes(currentFileExtension)) {
    // image files
    const viewerHtml = `<img class="img-fluid" src="/browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(currentFile))}" />`
    document.getElementById('file-errors').style.display = 'none'
    document.getElementById('file-contents').innerHTML = viewerHtml
    document.getElementById('file-output').style.display = 'block'
  } else if (viewExts.audio.includes(currentFileExtension)) {
    // audio files
    const viewerHtml = `<audio width="640" controls autoplay><source src="/browse/download?filepath=${Yoda.htmlEncode(encodeURIComponent(currentFile))}"></audio>`
    document.getElementById('file-errors').style.display = 'none'
    document.getElementById('file-contents').innerHTML = viewerHtml
    document.getElementById('file-output').style.display = 'block'
  } else if (Yoda.textFileExtensions.includes(currentFileExtension)) {
    // text files
    getTextObj(currentFileExtension)
  } else {
    // No supported format
    Yoda.set_message('error', 'This file has no viewable extension.')
    document.getElementById('file-error-message').innerHTML = 'It was not possible to load this file.'
    document.getElementById('file-output').style.display = 'none'
    // Dismiss stale messages.
    const closeButtons = document.querySelectorAll('#messages .close')
    closeButtons.forEach(button => button.click())
  }
})
