$(function() {
    $("#youthdata-intake-tree").treetable({
        expandable: true
    });

    $('#btn-meta-data').click(function(){
        var path = $('#helper').text();
        getMetaDataOnPath( path );
    });

    $("#youthdata-intake-tree tbody").on("mousedown", "tr", function() {

        var strNode = $(this).attr('data-tt-id');

        $('#helper').text( getFullPathOnNode(strNode) );

    });
});

function getMetaDataOnPath(strPath){
    var url = 'https://localhost/uu/yodaportal/intake/getMetaData';

    $.post(
        url,
        {path:strPath},
        function (data) {
            if(!data.hasError){
                var strMeta='';
                if(data.allMetaData.length){
                    for(i=0;i<data.allMetaData.length;i++){
                        strMeta += 'meta: ' + data.allMetaData[i]['name'] + '-> '+data.allMetaData[i]['value']+'\n';
                    }
                    alert(strMeta);
                }
            }
            else{
                alert('error');
            }
        }
    );
}

function getFullPathOnNode(strNode){
    var arNodes = strNode.split(".")
        ,strPath=''
        ,home_dir = $('#home-dir').text()
        ,nodeId='';

    for(i=1; i<arNodes.length; i++){
        nodeId ='';
        for(n=0; n<=i; n++){
            if(n>0){
                nodeId += '.'+ arNodes[n];
            }else{
                nodeId = arNodes[n]
            }
        }

        var tableRow = $("#youthdata-intake-tree tbody tr").filter(function() {
            return $(this).attr('data-tt-id') == nodeId;
        });

        strPath += '/' + tableRow.attr('data-target');
    }
    return home_dir + strPath;
}
