$(function() {
	$( ".datepicker" ).datepicker();

	// Modal - delete
	$('#confirm-delete').on('show.bs.modal', function(e) {
		var item = $(e.relatedTarget).attr('value');
		$(this).find('.item').text(item);

		var url = $(e.relatedTarget).attr('data-url');
		if (url)
		{
			$(this).find('.btn-ok').attr('href', url);
		}
	});
});
