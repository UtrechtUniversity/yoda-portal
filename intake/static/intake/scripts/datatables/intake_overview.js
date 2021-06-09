$(document).ready(function() {
     var mainTable = $('#datatable').DataTable({
        "stateSave":true,
        "language": {
            "sEmptyTable":     "No data found",
            "sInfo":           "Total datasets: <span>_TOTAL_</span>",
            "sInfoEmpty":      "No datasets present",
            "sLoadingRecords": "Loading...",
            "sProcessing":     "Processing...",
            "sSearch":         "Search",
            "sZeroRecords":    "No data found",
            "oPaginate": {
                "sFirst":    "First",
                "sLast":     "Last",
                "sNext":     "Next",
                "sPrevious": "Previous"
            }
        },
		"bSort": [],
         "columns": [
             { "data": "user"},
             {
                "data": null,
                "orderable":  false,
                "defaultContent": '<input type="checkbox" class="cbDataSet">'
             },
             {
                 "className":      'details-control',
                 "orderable":      false,
                 "data":           null,
                 "defaultContent": ''
             },
             { "data": "date" },
             { "data": "pseudo" },
             { "data": "type" },
             { "data": "wave" },
             { "data": "version" },
             { "data": "file_count" },
             { "data": "minfo" },
             { "data": "comment" },
             { "data": "status" },
             { "data": "creator" }
         ],
         "iDisplayLength": 50,
         "bPaginate": false,
         "bLengthChange": false,
	 "bFilter": false,
         "columnDefs": [
             { "visible": false, "targets": 0 },
             { "type": "alt-string", "targets": 3 }
         ],
         "drawCallback": function ( settings ) {
             var api = this.api();
             var rows = api.rows( ).nodes(); //{page:'current'}
             var last=null;

             api.column(0).data().each( function ( group, i ) {
                 if ( last !== group ) {
                     groupname = '<div class="datasetstatus_scanned" style="float:left;"></div><span style="float:left;margin-left:5px;margin-top:8px;">Scanned datasets</span>';
                     chbtext = '';
                     if(group=='LOCKED'){
                         groupname= '<div class="datasetstatus_locked" style="float:left;"></div><span style="float:left;margin-left:5px;margin-top:8px;">Submitted for transportation to vault - can be undone</span>';
                         chbtext = '<input type="checkbox" class="group" data-target="'+group+'" style="float:left;">&nbsp;';
                     }
                     if(group=='FROZEN'){
                         groupname='<div class="datasetstatus_frozen" style="float:left;"></div><span style="float:left;margin-left:5px;margin-top:8px;">Frozen for transportation to vault - cannot be undone</span>';
                     }
                     //$(rows).eq( i ).before(
                     //    '<tr class="group"><td colspan="11">' + chbtext + '<strong>' + groupname + '</strong></td></tr>'
                     //);

                     last = group;
                 }
             });

            // Required as every time page changes, this effect was lost.
             $('.cbDataSet').click(function(event){
                 event.stopPropagation();
                 handleVaultButtonStatus();
             });

         },
		"order": [[ 3, "desc" ]],
		"sDom": "<'row'<'col-sm-6'T><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
		"sPaginationType": "bootstrap",
		"fnInitComplete": function(oSettings, json) {
			//$('.dataTables_info span').text($('#totalSignups').text());
		}
    });

    $('#datatable tbody tr .cbDataSet').each(function(){
        if($(this).parent().parent().data('error-count')){
            $(this).parent().html('');
        }
    });

    // remove the checkboxes from columns that hold frozen datasets
    $('tr[data-target="FROZEN"] .cbDataSet').parent().html('');


    $('#datatable tbody').on('click', 'tr', function () {
        datasetRowClickForDetails($(this), mainTable);
    });

    // 1) prevent opening of dataset details when clicking on row.
    // 2) enable lock/unlock buttons as to make the relation between the checkboxes and buttons more evident
    $('.cbDataSet').click(function(event){
        event.stopPropagation();
        handleVaultButtonStatus();
    });

    // 1) check all checkboxes belonging to the group
    // 2) lock/unlock buttons as to make the relation between the checkboxes and buttons more evident
    $('#datatable tbody tr .group').click(function(){
        $('#datatable tbody tr[data-target="'+$(this).data('target')+'"] .cbDataSet').prop('checked',$(this).prop('checked'));
        handleVaultButtonStatus();
    });

    $('.control-all-cbDataSets').click(function(){
        $('.cbDataSet').prop('checked',$(this).prop('checked'));
        handleVaultButtonStatus();
    });


    $('#btn-lock').prop('disabled', true);
    $('#btn-unlock').prop('disabled', true);
} );

function handleVaultButtonStatus()
{
    // if no checkbox selected disable the buttons
    var anyChecked=false;
    $('.cbDataSet').each(function(){
        if($(this).prop('checked')){
            anyChecked=true;
            return false;
        }
    });

    if(anyChecked){
        //$('#btn-lock').prop('disabled', false);
//        $('#btn-lock').prop('disabled', false).removeClass('btn-default').removeClass('disabled').addClass('btn-primary');
//        $('#btn-unlock').prop('disabled', false).removeClass('btn-default').removeClass('disabled').addClass('btn-warning');
        $('#btn-lock').prop('disabled', false).addClass('btn-info'); //.removeClass('btn-default').addClass('btn-primary');
        $('#btn-unlock').prop('disabled', false).addClass('btn-warning'); //.removeClass('btn-default').addClass('btn-warning');
    }
    else{
        // $('#btn-lock').prop('disabled', true).removeClass('btn-primary').addClass('disabled').addClass('btn-default');
        // $('#btn-unlock').prop('disabled', true).removeClass('btn-warning').addClass('disabled').addClass('btn-default');
        $('#btn-lock').prop('disabled', true).removeClass('btn-info'); //.removeClass('btn-primary').addClass('btn-default');
        $('#btn-unlock').prop('disabled', true).removeClass('btn-warning');// .removeClass('btn-warning').addClass('btn-default');
    }
}
