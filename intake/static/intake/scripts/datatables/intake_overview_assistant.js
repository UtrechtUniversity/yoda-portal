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
             { "type": "alt-string", "targets": 2 }
         ],
         "drawCallback": function ( settings ) {
             var api = this.api();
             var rows = api.rows( ).nodes(); //{page:'current'}
             var last=null;

             api.column(0).data().each( function ( group, i ) {
                 if ( last !== group ) {
                     groupname = '<div class="datasetstatus_scanned"  style="float:left;"></div><span style="float:left;margin-left:5px;margin-top:8px;">Scanned datasets</span>';
                     if(group=='LOCKED'){
                         groupname= '<div class="datasetstatus_locked"  style="float:left;"></div><span style="float:left;margin-left:5px;margin-top:8px;">Submitted for transportation to vault - can be undone</span>';
                     }
                     if(group=='FROZEN'){
                         groupname='<div class="datasetstatus_frozen"  style="float:left;"></div><span style="float:left;margin-left:5px;margin-top:8px;">Frozen for transportation to vault - cannot be undone</span>';
                     }
                     //$(rows).eq( i ).before(
                     //    '<tr class="group"><td colspan="11">' + '&nbsp;<strong>' + groupname + '</strong></td></tr>'
                     //);

                     last = group;
                 }
             });
         },
		"order": [[ 2, "desc" ]],
		"sDom": "<'row'<'col-sm-6'T><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
		"sPaginationType": "bootstrap",
		"fnInitComplete": function(oSettings, json) {
			//$('.dataTables_info span').text($('#totalSignups').text());
		}
    });

    $('#datatable tbody').on('click', 'tr', function () {
        datasetRowClickForDetails($(this), mainTable);
    });
    // prevent opening of dataset details when clicking on row.
    $('.cbDataSet').click(function(event){
        event.stopPropagation();
    });
} );
