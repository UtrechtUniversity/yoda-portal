$(function() {
//    # ??? wat doet dit nu??
//    get_studies();
//   get_studies_dm();
//    get_datasets('grp-intake-initial');
//    get_unrecognized_files('grp-intake-initial')

    var tableUnrecognised = $('#datatable_unrecognised').DataTable({
        "language": {
            "sEmptyTable":     "No data found",
            "sInfo":           "Total files: <span>_TOTAL_</span>",
            "sInfoEmpty":      "No files present",
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
            { "data": "date" },
            { "data": "name" },
            { "data": "pseudo" },
            { "data": "type" },
            { "data": "wave" },
            { "data": "version" },
            { "data": "status" },
            { "data": "creator" }
        ],
        "iDisplayLength": 50,
        "bPaginate": false,
        "bLengthChange": false,
        "bFilter": false,
        "order": [[ 6, "desc" ]],
        "sDom": "<'row'<'col-sm-6'T><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
        "sPaginationType": "bootstrap",
        "fnInitComplete": function(oSettings, json) {
            //$('.dataTables_info span').text($('#totalSignups').text());
        }
    });

    $('#btn-start-scan').click(function(){
        var study_id = 'grp-intake-' + $('#studyID').val();

        $(this).prop('disabled', true).addClass('disabled');
        inProgressStart('Scanning in progress...');
        Yoda.call('intake_scan_for_datasets',
                  {coll: Yoda.basePath + '/' + study_id}).then((data) => {
            console.log(data);
            if (data.proc_status=='OK') {
                reload_page_with_alert('5');
            }
            else {
                reload_page_with_alert('6')
            }
        })
    });

    // datamanager only
    $('#btn-lock').click(function(){
        var datasets = [],
            intake_path = Yoda.basePath + '/' + 'grp-intake-' + $('#studyID').val();
        inProgressStart('Locking in progress...');

        $('.cbDataSet').each(function(){
            if($(this).prop('checked')){
                datasets.push($(this).parent().parent().data('dataset-id'));
            }
        });
        handleLockingAndAlerts(intake_path, datasets.toString());
    });

    // datamanager only
    $('#btn-unlock').click(function(){
        var datasets = [],
            intake_path = Yoda.basePath + '/' + 'grp-intake-' + $('#studyID').val();
        inProgressStart('Locking in progress...');

        $('.cbDataSet').each(function(){
            if($(this).prop('checked')){
                datasets.push($(this).parent().parent().data('dataset-id'));
            }
        });
        handleUnlockingAndAlerts(intake_path, datasets.toString());
    });

    async function handleLockingAndAlerts(intake_path, dataset_ids)
    {
        result = await Yoda.call('intake_lock_dataset', {"path": intake_path, "dataset_ids": dataset_ids});
        if (result.proc_status!='OK') {
            reload_page_with_alert('2');
            return;
        }
        reload_page_with_alert('1');
    }

    async function handleUnlockingAndAlerts(intake_path, dataset_ids)
    {
        result = await Yoda.call('intake_unlock_dataset', {"path": intake_path, "dataset_ids": dataset_ids});
        if (result.proc_status!='OK') {
            reload_page_with_alert('4');
            return;
        }
        reload_page_with_alert('3');
    }

    function addCommentToDataset(studyId, table, datasetId, comment)
    {
        if(comment.length==0){
            alert('Please enter a comment first.');
        }
        else{
            Yoda.call('intake_dataset_add_comment',
                      {"study_id": studyId,
                       "dataset_id": datasetId,
                       "comment": comment}).then((data) => {
                console.log(data);
                $('tr:last', table).before(
                                 '<tr><td>'  + $('<div>').text(data.user).html()
                               + '</td><td>' + $('<div>').text(data.timestamp).html()
                               + '</td><td>' + $('<div>').text(data.comment).html()
                               + '</td></tr>'
                );
                $('input[name="comments"]', table).val('');           
            })

            return;

            $.post(
                Yoda.baseUrl + ['intake','saveDatasetComment'].join('/'),
                {   "studyID": study,
                    "datasetID":datasetId,
                    "comment": comment,
                    "csrf_yoda": csrf_key
                },
                function (data) {
                    if(!data.hasError){
                        console.log(data);
                        $('tr:last', table).before(
                                 '<tr><td>'  + $('<div>').text(data.output.user).html()
                               + '</td><td>' + $('<div>').text(data.output.timestamp).html()
                               + '</td><td>' + $('<div>').text(data.output.comment).html()
                               + '</td></tr>'
                       );
                        $('input[name="comments"]', table).val('');
                    }
                    else{
                        alert('Your comment could not be processed. Please try again.');
                    }
                }
            );
        }
    }

    $('#datatable').on('keypress', 'input[name="comments"]', function(e) {
        if (e.which == 13) {
            var study = $('#studyID').val();
            var table = $(this).closest('table');
            var datasetId = table.data('dataset-id');
            var comment = $(this).val();

            addCommentToDataset(study, table, datasetId, comment);
            return false;
        }
    });

    $('#datatable').on('click', '.btn-add-comment', function(e) {
        var study = $('#studyID').val();
        var table = $(this).closest('table');
        var datasetId = table.data('dataset-id');
        var comment = $('input[name="comments"]', table).val();

        addCommentToDataset(study, table, datasetId, comment);
    });

    // hiding of alert panel
    $("[data-hide]").on("click", function(){
        $(this).closest("." + $(this).attr("data-hide")).hide();
    });

    $('#datatable_unrecognised tbody').on('click', 'tr', function () {
        var bodyText = $(this).data('path');
        if(bodyText) {
            informDialog($(this).data('error'), bodyText);
        }
    });

    $('#select-study tr').click(function(){
        document.location = $(this).data('study-url');
    });
    $('#select-study-folder tr').click(function(){
        document.location = $(this).data('study-folder-url');
    });

    msg = ''
    // Alert Handling after reload
    if (alertNr=='1') {
        msg = 'Successfully locked the selected dataset(s).';
        alertType = 'success';
    }
    else if (alertNr=='2') {
        msg = 'There was a problem locking the selected dataset(s).';
        alertType = 'danger';
    }
    else if (alertNr=='3') {
        msg = 'Successfully unlocked the selected dataset(s).';
        alertType = 'success';
    }
    else if (alertNr=='4') {
        msg = 'There was a problem unlocking the selected dataset(s)';
        alertType = 'danger';
    }
    else if (alertNr=='5') {
        msg = 'Successfully scanned for datasets.';
        alertType = 'success';
    }
    else if (alertNr=='6') {
        msg = 'There was a problem during the scanning process.';
        alertType = 'danger';
    }

    if (msg.length) {
        $('#messages').html('<div class="alert alert-' + alertType + '"><button class="close" data-dismiss="alert"><span>×</span></button><p>' + msg + '</p></div>');
    }

    console.log($("#studyID").val())
    console.log($("#studyFolder").val());
    console.log(window.location.origin);
    console.log(window.location.pathname);
    
});

function reload_page_with_alert(alertNr) {
    console.log($("#studyID").val())
    console.log($("#studyFolder").val());
    var studyID = $("#studyID").val(),
        studyFolder= $("#studyFolder").val();

    params = '?studyID=' + studyID;
    if (studyFolder) {
        params += '&studyFolder=' + studyFolder;
    }
    window.location.replace(window.location.origin + window.location.pathname + params + '&alertNr=' + alertNr);
}

function datasetRowClickForDetails(obj, mainTable)
{
    var tr = obj.closest('tr');
    var row = mainTable.row( tr );

    if ( row.child.isShown() ) {
        // This row is already open - close it
        row.child.hide();
        tr.removeClass('shown');
    }
    else {
        // Open this row
        var tbl_id = tr.data('row-id'),
            url = Yoda.baseUrl + ['intake','getDatasetDetailView'].join('/'),
            csrf_key = $('input[name="csrf_yoda"]').val();

        //return;
        //
        // "csrf_token": Yoda.csrf.tokenValue
        url = 'getDatasetDetailView' 
        $.post(
            url,
            {   tbl_id: tbl_id,
                path: tr.data('ref-path'),
                studyID: $('#studyID').val(),
                datasetID: tr.data('dataset-id'),
//                csrf_yoda: csrf_key,
                "csrf_token": Yoda.csrf.tokenValue
            },
            function (data) {
                if(!data.hasError){
                    html_tree = data.output;

                    row.child( html_tree ).show();

                    $("#tree"+tbl_id).treetable({
                        expandable: true
                    });
                    $("#tree"+tbl_id).treetable("expandAll");

                    tr.addClass('shown');
                }
            }
        );
    }
}

function inProgressStart(progressText)
{
    $('.progress_indicator h1').text(progressText);
    $('.progress_indicator').show();
}

function inProgressEnd()
{
    $('.progress_indicator').hide();
}

function informationPanel(alertClass, message)
{
    $('.alert').removeClass('alert-danger').removeClass('alert-success').addClass('alert-'+alertClass);
    $('.alert .info_text').text(message);
    $('.alert').show();
}

function informDialog(title, bodytext)
{
    var modal = $('#dialog-ok');

    $('.modal-header h3', modal).text(title);
    $('.modal-body .item', modal).text(bodytext);

    modal.modal('show');
}

function modalDialog(title, url)
{
    var modal = $('#select-generic-modal'),
        iframeDocument = $('iframe', modal).get(0).contentWindow.document;

    $('.modal-header h3', modal).text(title);

    iframeDocument.location.href = url;

    $('.modal-body iframe', modal).show();
    $('#select-generic-modal').modal('show');
}

async function get_studies()
{
    let result = await Yoda.call('intake_list_studies', {});
    console.log(result);
}

async function get_studies_dm()
{
    let result = await Yoda.call('intake_list_dm_studies', {});
    console.log(result);
}

async function get_datasets(coll)
{
    let result = await Yoda.call('intake_list_datasets',
        {
            coll: Yoda.basePath + '/' + 'grp-intake-initial'
        })

    console.log(result);
}


async function get_unrecognized_files(coll)
{
    let result = await Yoda.call('intake_list_unrecognized_files',
    {
        coll: Yoda.basePath + '/' + 'grp-intake-initial'
    })

    console.log(result);
}
