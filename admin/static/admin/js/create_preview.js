/* global bootstrap, DOMPurify */
'use strict'

/* eslint-disable no-unused-vars */
// Function to preview publication terms in a specific modal
function createPreview () {
  // Get the content of the textarea and sanitize it
  const termsText = document.getElementById('publicationTerms').value
  const sanitizedContent = DOMPurify.sanitize(termsText)

  // Set the content in the modal body for preview
  const modalBody = document.querySelector('#confirmAgreementConditions .modal-body')
  modalBody.innerHTML = sanitizedContent

  // Show the modal
  const myModal = new bootstrap.Modal(document.getElementById('confirmAgreementConditions'))
  myModal.show()
}
/* eslint-enable no-unused-vars */
