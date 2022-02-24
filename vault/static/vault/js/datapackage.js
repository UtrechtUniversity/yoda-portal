"use strict";

$(document).ajaxSend(function(e, request, settings) {
    // Append a CSRF token to all AJAX POST requests.
    if (settings.type === 'POST' && settings.data.length) {
         settings.data
             += '&' + encodeURIComponent(Yoda.csrf.tokenName)
              + '=' + encodeURIComponent(Yoda.csrf.tokenValue);
    }
});

let preservableFormatsLists = null;
let currentFolder;
var bounds = [[1,1][1,1]]
var mymap = null;
var maplayer = null;

$(function() {
    // Extract current location from query string (default to '').
    currentFolder = decodeURIComponent((/(?:\?|&)dir=([^&]*)/
                                        .exec(window.location.search) || [0,''])[1]);

    currentFolder = browseStartDir;
    // Canonicalize path somewhat, for convenience.
    currentFolder = currentFolder.replace(/\/+/g, '/').replace(/\/$/, '');

    $('.btn-copy-to-clipboard').click(function(){
        // var text = $('.metadata-identifier').val();
        textToClipboard($('.metadata-identifier').text());
        alert('Copied to clipboard: ' + $('.metadata-identifier').text());
    });

    mymap = L.map('map1').fitBounds([[51.505, -0.09],[51.505, -0.09]], {'maxZoom': 5});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
    }).addTo(mymap);

    // Trick to make leaflet work within a bootstrap modal
    $('#viewMap').on('shown.bs.modal', function(){
         setTimeout(function() {
            mymap.invalidateSize();
            // When presenting a point set the zoom factor differently as to give more direct context
            if (bounds[0][0]==bounds[1][0] && bounds[0][1]==bounds[1][1]) {
                mymap.fitBounds(bounds, {'maxZoom': 4});
            }
            else {
                mymap.fitBounds(bounds, {'maxZoom': 8});
            }
         }, 10);
    });

    metadataInfo(currentFolder);
});

function metadataInfo(dir) {
    /* Loads metadata of the vault packages */
    let pathParts = dir.split('/');

    // Do not show metadata outside data package.
    if (pathParts.length < 3) {
        $('.metadata-info').hide();
        return;
    } else {
        pathParts.length = 3;
        dir = pathParts.join("/");
    }

    try {
        Yoda.call('meta_form_load',
            {coll: Yoda.basePath + dir},
            {rawResult: true})
        .then((result) => {
            if (!result || jQuery.isEmptyObject(result.data))
                return console.info('No result data from meta_form_load');

            let metadata = result.data.metadata;
            $('.metadata-info').show();

            // Owner(s) - within yoda-metadata.json Creator
            let creators = [];
            for (let c in metadata.Creator){
                let fullname = "".concat(metadata.Creator[c].Name.Given_Name, " ", metadata.Creator[c].Name.Family_Name);
                fullname += ' (' + metadata.Creator[c].Owner_Role + ')'
                creators.push(fullname);
            }
            $('.metadata-creator').text(creators.join(', '));

            $(".metadata-title").text(metadata.Title);

            if (metadata.Description){
                let description = metadata.Description;
                let wordCount = description.match(/(\w+)/g). length;
                if (wordCount < 50 ){
                    $(".metadata-description").text(description);
                } else {
                    $(".metadata-description").text(truncate(description, 50));
                    $('.read-more-button').show();
                    $('.read-more-button').on('click', function(){
                        $(".metadata-description").text(description);
                        $('.read-more-button').hide();
                        $('.read-less-button').show();
                    })
                    $('.read-less-button').on('click', function(){
                        $(".metadata-description").text(truncate(description, 50));
                        $('.read-more-button').show();
                        $('.read-less-button').hide();
                    })
                }
            }

            $('.metadata-keywords').text(metadata.Tag.join(', '));
            $('.metadata-research-group').text(metadata.Research_Group);
            $('.metadata-project').text(metadata.Collection_Name);

            let owners = [];
            for (let c in metadata.Creator){
                let fullname = "".concat(metadata.Creator[c].Name.Given_Name, " ", metadata.Creator[c].Name.Family_Name);
                fullname += ', ' + metadata.Creator[c].Affiliation + ', ' + metadata.Creator[c].Owner_Role
                owners.push(fullname);
            }
            $('.metadata-owners').text(owners.join(', '));

            // Contact person is placed within contributors. Only 1
            let contributors = [];
            for (let c in metadata.Contributor){
                let fullname = "".concat(metadata.Contributor[c].Name.Given_Name, " ", metadata.Contributor[c].Name.Family_Name);
                contributors.push(fullname);
            }

            // Contact person - within yoda-metadata.json Contributor
            $('.metadata-contact-person').text(contributors.join(', '));

            $('.metadata-research-period').text(metadata.Collected.Start_Date + ' - ' + metadata.Collected.End_Date);

            let geolocations = [];
            for (let c in metadata.GeoLocation){
                let loc = metadata.GeoLocation[c];
                let row = '<tr><td style="width:200px;">' + loc.Description_Spatial + '</td>';

                row += '<td><button class="btn btn-outline-secondary show-map"';
                row += ' data-lon0="' + loc.geoLocationBox.eastBoundLongitude.toString() + '"';
                row += ' data-lat0="' + loc.geoLocationBox.northBoundLatitude.toString() + '"';
                row += ' data-lon1="' + loc.geoLocationBox.westBoundLongitude.toString() + '"';
                row += ' data-lat1="' + loc.geoLocationBox.southBoundLatitude.toString() + '"';
                row += ' data-spatial="' + loc.Description_Spatial + '"';
                row += '><i class="fa fa-map"></i> Show map</button></td>';
                row += '</tr>'

                geolocations.push(row);
            }
            $('.metadata-geo-locations').html('<table>' + geolocations.join('') + '</table>');

            let references = [];
            for (let c in metadata.Related_Datapackage){
                let ref = metadata.Related_Datapackage[c]
                let row = '<tr><td style="width:300px;">' + ref.Title + '</td><td style="width:50px;">' + ref.Persistent_Identifier.Identifier_Scheme + ': </td>';
                row += '<td><a href="https://reference.com">' + metadata.Related_Datapackage[c].Persistent_Identifier.Identifier + '</a></td></tr>'
                references.push(row);
            }
            $('.metadata-references').html('<table>' + references.join('') + '</table>');

            $('.metadata-personal-data').text(metadata.Data_Classification);
            $('.metadata-retention-period').text(metadata.End_Preservation + " years");

            $('.show-map').click(function(){
                let lon0 = parseFloat($(this).data('lon0'));
                let lat0 = parseFloat($(this).data('lat0'));
                let lon1 = parseFloat($(this).data('lon1'));
                let lat1 = parseFloat($(this).data('lat1'));
                let descr_spatial = $(this).data('spatial');

                $('.modal-map-title').html(descr_spatial);

                bounds = [[lat0, lon0], [lat1, lon1]];

                // Point or rectangle
                if (maplayer){
                    mymap.removeLayer(maplayer);
                }
                if (lat0==lat1 && lon0==lon1) {
                    maplayer = L.marker([lat0, lon0]).addTo(mymap);
                } else {
                    maplayer = L.rectangle([[lat0, lon0],[lat1, lon1]]).addTo(mymap);
                }

                $('#viewMap').modal('show');
            })
        });
    }
    catch (error) {
        console.error(error);
    }

    try {
        Yoda.call('vault_get_deposit_data',
            {coll: Yoda.basePath + dir},
            {rawResult: true})
        .then((result) => {
            if (!result || jQuery.isEmptyObject(result.data))
                return console.info('No result data from vault_get_deposit_data');

            let date_deposit = result.data.deposit_date;
            $('.metadata-info').show();
            let end_date = new Date(date_deposit);
            let retention_period = parseInt($('.metadata-retention-period').text());
            // Determine end date by adding retention period to the deposit date
            end_date.setFullYear(end_date.getFullYear() + retention_period);
            // console.log(end_date.toJSON().substring(0,10));
            $('.metadata-deposit-date').text(date_deposit);
            $('.metadata-retention-period').text(end_date.toJSON().substring(0,10) + ' (' + retention_period.toString() + ' years)');
        });
    }
    catch (error) {
        console.error(error);
    }
}

function truncate(str, nr_words) {
    // Truncate string on n number of words
    return str.split(" ").splice(0,nr_words).join(" ");
}

function textToClipboard (text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}
