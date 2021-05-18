$(function() {
    $('#select-study tr').click(function(){
        document.location = $(this).data('study-url');
    });

    $('#export-data').click(function(){
        alert('This is not implemented yet.');
    });
});