$(function() {
    $('#select-study tr').on('click', function (){
        document.location = $(this).data('study-url');
    });

    $('#export-data').on('click', function (){
        alert('This is not implemented yet.');
    });
});
