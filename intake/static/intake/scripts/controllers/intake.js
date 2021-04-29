$(function() {
//    # ??? wat doet dit nu??
    get_studies();
    get_studies_dm();
    get_datasets('grp-intake-initial');
    get_unrecognized_files('grp-intake-initial')

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
        Yoda.baseUrl = '';
        var url_org = Yoda.baseUrl + ['intake','scanSelection'].join('/'),
            url = 'scanSelection',
            collection=$('#collection').val();

        var study_id = 'grp-intake-' + $('#studyID').val();
        var parameters = {
            "studyID": study_id,
            "collection": collection,
            "csrf_token": Yoda.csrf.tokenValue
        };

        console.log(url);
        console.log(parameters);
        console.log(Yoda.basePath);
        // return;

        console.log('ervoor');
        Yoda.call('intake_scan_for_datasets',
                  {coll: Yoda.basePath + '/' + study_id}).then((data) => {
            console.log(data);
            location.reload();
        })
        console.log('erna');

        inProgressStart('Scanning in progress...');
        // console.log('$.post');
        // $.post(
        //    url,
        //    parameters,
        //    function (data) {
        //        console.log(data);
        //        location.reload();
        //    }
        // );
    });

    // Obsolete
    $('#btn-start-scan-selection').click(function(){
        var url = Yoda.baseUrl + ['intake','scanSelection'].join('/'),
            collections=[],
            csrf_key = $('input[name="csrf_yoda"]').val();

        $('.scanFolder').each(function(){
            if($(this).prop('checked')){
                //alert($(this).data('target'));
                collections.push($(this).data('target'));
            }
        });

        var parameters = {
            "studyID": $('#studyID').val(),
            "collections[]": collections,
            "csrf_yoda": csrf_key

        };

        inProgressStart('Scanning in progress...');

        $.post(
            url,
            parameters,
            function (data) {
                location.reload();
            }
        );
    });

    // datamanager only
    $('#btn-lock').click(function(){
        var url = Yoda.baseUrl + ['intake','lockDatasets'].join('/'),
            datasets=[],
            csrf_key = $('input[name="csrf_yoda"]').val();

        // if(datasets.length==0){
        //     return alert('Please select at least one dataset.');
        // }

        intake_path = Yoda.basePath + '/' + 'grp-intake-' + $('#studyID').val();
        inProgressStart('Locking in progress...');

        $('.cbDataSet').each(function(){
            if($(this).prop('checked')){
                // datasets.push($(this).parent().parent().data('dataset-id'));
                dataset_id = $(this).parent().parent().data('dataset-id');
                Yoda.call('intake_lock_dataset', {"path": intake_path, "dataset_id": dataset_id});
            }
        });
        location.reload();

        return;

        var parameters = {
            "studyID": $('#studyID').val(),
            "datasets[]": datasets,
            "csrf_yoda": csrf_key
        };

        $.post(
            url,
            parameters,
            function (data) {
                location.reload();
            }
        );
    });

    // datamanager only
    $('#btn-unlock').click(function(){
        var url = Yoda.baseUrl + ['intake','unlockDatasets'].join('/'),
            datasets=[],
            csrf_key = $('input[name="csrf_yoda"]').val();

        // if(datasets.length==0){
        //     return alert('Please select at least one dataset.');
        // }

        intake_path = Yoda.basePath + '/' + 'grp-intake-' + $('#studyID').val();
        inProgressStart('Unlocking in progress...');

        $('.cbDataSet').each(function(){
            if($(this).prop('checked')){
                dataset_id = $(this).parent().parent().data('dataset-id');
                Yoda.call('intake_unlock_dataset', {"path": intake_path, "dataset_id": dataset_id});
            }
        });
        location.reload();

        return;


// ----------------------
        $('.cbDataSet').each(function(){
            if($(this).prop('checked')){
                datasets.push($(this).parent().parent().data('dataset-id'));
            }
        });

        if(datasets.length==0){
            return alert('Please select at least one dataset.');
        }

        var parameters = {
            "studyID": $('#studyID').val(),
            "datasets[]": datasets,
            csrf_yoda: csrf_key
        };

        inProgressStart('Unlocking in progress...');

        $.post(
            url,
            parameters,
            function (data) {
                location.reload();
            }
        );
    });

    // obsolete - test for comments dialog
    $('#btn-show-comments').click(function(){
        var title='Comments on data set',
            url = Yoda.baseUrl+'intake/dlg_dataset_comments';

        modalDialog('Comments on data set', url);
        return;

        var modal = $('#select-generic-modal'),
            iframeDocument = $('iframe', modal).get(0).contentWindow.document;

        $('.modal-header h3', modal).html(title);
        //alert( Yoda.baseUrl+'/intake/dlg_dataset_comments' );

        iframeDocument.location.href = Yoda.baseUrl+'intake/dlg_dataset_comments';

        $('.modal-body iframe', modal).show();
        $('#select-generic-modal').modal('show');
    });

    function addCommentToDataset(study, table, datasetId, comment)
    {
        if(comment.length==0){
            alert('Please enter a comment first.');
        }
        else{
            var csrf_key = $('input[name="csrf_yoda"]').val();

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
});

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
