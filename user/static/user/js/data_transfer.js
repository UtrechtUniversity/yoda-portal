/* global hljs */
'use strict'

document.addEventListener('DOMContentLoaded', function () {
  hljs.highlightAll()

  const snippets = document.getElementsByTagName('pre')
  for (let i = 0; i < snippets.length; i++) {
    snippets[i].classList.add('hljs') // append copy button to pre tag
    snippets[i].innerHTML = '<button id="button' + (i + 1) + '" class="hljs-copy btn btn-secondary btn-copy-to-clipboard mt-2 me-2 float-end"><i class="fa fa-copy"></i> Copy</button>' + snippets[i].innerHTML
  }

  const copyButtons = document.querySelectorAll('.btn-copy-to-clipboard')
  copyButtons.forEach(button => {
    button.addEventListener('click', function () {
      let codeBlockId
      if (this.id === 'button1') {
        codeBlockId = 'code-block1'
      } else if (this.id === 'button2') {
        codeBlockId = 'code-block2'
      } else if (this.id === 'button3') {
        codeBlockId = 'code-block3'
      }

      const codeContent = document.getElementById(codeBlockId).textContent
      const textArea = document.createElement('textarea')
      textArea.textContent = codeContent
      document.body.append(textArea)

      textArea.select()
      document.execCommand('copy')

      textArea.remove()
    })
  })

  const downloadButtons = document.querySelectorAll('.btn-download-file')
  downloadButtons.forEach(button => {
    button.addEventListener('click', function () {
      let codeBlockId
      let filename
      if (this.id === 'download-button1') {
        codeBlockId = 'code-block1'
        filename = 'irods_environment.json'
      } else if (this.id === 'download-button2') {
        codeBlockId = 'code-block2'
        filename = 'config.yml'
      } else if (this.id === 'download-button3') {
        codeBlockId = 'code-block3'
        filename = 'irods_environment.json'
      }

      const codeContent = document.getElementById(codeBlockId).textContent
      const link = document.createElement('a')
      const file = new Blob([codeContent], { type: 'text/plain' })

      link.href = URL.createObjectURL(file)
      link.download = filename
      link.click()

      URL.revokeObjectURL(link.href)
    })
  })
})
