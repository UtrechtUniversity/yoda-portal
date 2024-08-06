// Function to preview publication terms in a specific modal
function createPreview() {
    // Get the content of the textarea and sanitize it
    var termsText = document.getElementById('publicationTerms').value;
    const sanitizedContent = DOMPurify.sanitize(termsText);

    // Set the content in the modal body for preview
    const modalBody = document.querySelector('#confirmAgreementConditions .modal-body');
    modalBody.innerHTML = sanitizedContent;

    // Show the modal
    var myModal = new bootstrap.Modal(document.getElementById('confirmAgreementConditions'));
    myModal.show();
}
