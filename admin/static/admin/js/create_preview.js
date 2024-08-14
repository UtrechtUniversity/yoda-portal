/* global bootstrap, DOMPurify */
'use strict'

$(document).ready(function () {
  // Preview publication terms in a modal.
  $('#admin-create-preview').on('click', function () {
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
  $('#confirmAgreementConditions').on('click', '.action-confirm-submit-for-publication', function () {
    $('#confirmAgreementConditions').modal('hide')
  })
})
