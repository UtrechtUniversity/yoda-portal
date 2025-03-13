/* global bootstrap, DOMPurify */
'use strict'

document.addEventListener('DOMContentLoaded', function () {
  // Preview publication terms in a modal.
  document.getElementById('admin-create-preview').addEventListener('click', function () {
    // Get the content of the textarea and sanitize it.
    const termsText = document.getElementById('admin-publication-terms').value
    const sanitizedContent = DOMPurify.sanitize(termsText)

    // Set the content in the modal body for preview.
    const modalBody = document.querySelector('#confirmAgreementConditions .modal-body')
    modalBody.innerHTML = sanitizedContent

    // Show the modal.
    const myModal = new bootstrap.Modal(document.getElementById('confirmAgreementConditions'))
    myModal.show()
  })

  // Click the Confirm button to dismiss
  document.getElementById('confirmAgreementConditions').addEventListener('click', function (event) {
    if (event.target.classList.contains('action-confirm-submit-for-publication')) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('confirmAgreementConditions'))
      modal.hide()
    }
  })
})
