/* global bootstrap, DOMPurify */
'use strict'

// Preview publication terms in a modal.
$('.btn-create-preview').on('click', function () {
  // Get the content of the textarea and sanitize it.
  const termsText = document.getElementById('publicationTerms').value
  const sanitizedContent = DOMPurify.sanitize(termsText)

  // Set the content in the modal body for preview.
  const modalBody = document.querySelector('#confirmAgreementConditions .modal-body')
  modalBody.innerHTML = sanitizedContent

  // Show the modal.
  const myModal = new bootstrap.Modal(document.getElementById('confirmAgreementConditions'))
  myModal.show()
})
