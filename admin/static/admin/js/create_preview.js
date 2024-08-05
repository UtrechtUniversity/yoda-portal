// Function to preview publication terms in a specific modal
function createPreview() {
    $.ajax({
        url: '/admin/get_publication_terms',  // Endpoint to fetch publication terms
        type: 'GET',
        success: function (response) {
            const modalBody = document.querySelector('#confirmAgreementConditions .modal-body');
            modalBody.innerHTML = response.terms; // Display terms in modal body

            const modalElement = new bootstrap.Modal(document.getElementById('confirmAgreementConditions'));
            modalElement.show();
        },
        error: function () {
            console.error("Error: Failed to load publication terms.");
            const modalBody = document.querySelector('#confirmAgreementConditions .modal-body');
            modalBody.innerHTML = "Failed to load publication terms.";  // Display error message in modal body

            const modalElement = new bootstrap.Modal(document.getElementById('confirmAgreementConditions'));
            modalElement.show();
        }
    });
}
