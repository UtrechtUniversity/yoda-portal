function createPreview() {
    $.ajax({
        url: '/admin/api/publication-terms',  // Endpoint from which to fetch publication terms
        type: 'GET',
        success: function (response) {
            // Assuming the response returns a JSON object with a 'terms' property
            const modalBody = document.querySelector('#confirmAgreementConditions .modal-body');
            modalBody.innerHTML = response.terms;  // Insert the fetched terms into the modal body

            // Show the modal using Bootstrap's JavaScript API
            const modalElement = new bootstrap.Modal(document.getElementById('confirmAgreementConditions'));
            modalElement.show();
        },
        error: function () {
            console.error("Failed to load publication terms.");
            const modalBody = document.querySelector('#confirmAgreementConditions .modal-body');
            modalBody.innerHTML = "Failed to load publication terms.";  // Display error message in modal body

            // Show the modal even in case of error to display the error message
            const modalElement = new bootstrap.Modal(document.getElementById('confirmAgreementConditions'));
            modalElement.show();
        }
    });
}
