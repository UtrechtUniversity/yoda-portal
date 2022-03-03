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

var mdata = {};

var metadata; // Make it global so functions on different levels can access it without having to pass it as a parameter entirely
var mfunction = {};

mfunction['Tag'] = function(a){ return a.join(', ');}
mfunction['End_Preservation'] = function(retention_period) {
    let end_date = new Date(metadata['Date_Deposit']);
    let ret_per = parseInt(retention_period);
    // Determine end date by adding retention period to the deposit date
    end_date.setFullYear(end_date.getFullYear() + ret_per);
    console.log(end_date.toJSON().substring(0,10));
    return end_date.toJSON().substring(0,10) + ' (' + ret_per.toString() + ' years)';
    // return retention_period;
}

mfunction['research_period'] = function(){ return metadata.Collected.Start_Date + ' - ' + metadata.Collected.End_Date;}

// Contact person is placed within contributors. Only 1
// Contact person - within yoda-metadata.json Contributor
mfunction['Contributor'] = function(Contributor) {
    let contributors = [];
    for (let c in Contributor){
        let fullname = "".concat(Contributor[c].Name.Given_Name, " ", Contributor[c].Name.Family_Name);
        contributors.push(fullname);
    }
    return contributors.join(', ');
}

mfunction['Creator'] = function(Creator) {
            let owners = [];
            for (let c in Creator){
                let fullname = "".concat(Creator[c].Name.Given_Name, " ", Creator[c].Name.Family_Name);
                fullname += ', ' + Creator[c].Affiliation + ', ' + Creator[c].Owner_Role
                owners.push(fullname);
            }
            return owners.join(', ');
}

mfunction['Related_Datapackage'] = function(Related_Datapackage) {
            let references = [];
            for (let c in Related_Datapackage){
                let ref = Related_Datapackage[c]
                let row = '<tr><td style="width:300px;">' + ref.Title + '</td><td style="width:50px;">' + ref.Persistent_Identifier.Identifier_Scheme + ': </td>';
                row += '<td><a href="https://reference.com">' + Related_Datapackage[c].Persistent_Identifier.Identifier + '</a></td></tr>'
                references.push(row);
            }
            return '<table>' + references.join('') + '</table>';
}

mfunction['GeoLocation'] = function(GeoLocation) {
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
            return '<table>' + geolocations.join('') + '</table>';
}

var key;



$(function() {
    // Extract current location from query string (default to '').
    currentFolder = decodeURIComponent((/(?:\?|&)dir=([^&]*)/
                                        .exec(window.location.search) || [0,''])[1]);

    currentFolder = browseStartDir;
    // Canonicalize path somewhat, for convenience.
    currentFolder = currentFolder.replace(/\/+/g, '/').replace(/\/$/, '');

    $('.btn-copy-to-clipboard').click(function(){
        textToClipboard($('.metadata-identifier').text());
        Yoda.set_message('success', 'DAG permalink identifier has been copied to the clipboard');
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


    // metadataShow();
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

            metadata = result.data.metadata;
            console.log('1')
            //console.log(metadata);
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
            metadata['Date_Deposit'] = date_deposit;
            console.log('2');

            metadataShow();

            //console.log(metadata);

            // $('.metadata-info').show();
            //let end_date = new Date(date_deposit);
            // let retention_period = parseInt($('.metadata-retention-period').text());
            // end_date.setFullYear(end_date.getFullYear() + retention_period);

            // end_date.setFullYear(end_date.getFullYear() + retention_period);
           
        });
    }
    catch (error) {
        console.error(error);
    }
    // console.log('THIS IS IT');
    // console.log(metadata);

}

function metadataShow() {
    console.log('SHOW');
    console.log(metadata);

            let creators = [];
            for (let c in metadata.Creator){
                let fullname = "".concat(metadata.Creator[c].Name.Given_Name, " ", metadata.Creator[c].Name.Family_Name);
                fullname += ' (' + metadata.Creator[c].Owner_Role + ')'
                creators.push(fullname);
            }
            $('.metadata-title').text(metadata['Title']);
            $('.metadata-creator').text(creators.join(', '));

            let description = metadata['Description'];
            let wordCount = description.match(/(\w+)/g). length;
            console.log(wordCount);
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

            $('.metadata').each(function(){
                let dp_attr = $(this).data('dp-attr');
                console.log(dp_attr);

                let data = metadata[dp_attr];
                let func = mfunction[dp_attr];

                if (dp_attr == 'Related_Datapackage' || dp_attr == 'GeoLocation') {
                    $(this).html( func (data) );
                }
                else if (data || func) {
                    if (func) {
                        if (data) {
                            $(this).text( func( data ) );
                        }
                        else {
                            $(this).text( func() );
                        }
                    }
                    else {
                        $(this).text(data);
                    }
                    $(this).closest('.row').removeClass('hidden');
                }
            });

            $('.show-map').click(function(){
                let lon0 = parseFloat($(this).data('lon0'));
                let lat0 = parseFloat($(this).data('lat0'));
                let lon1 = parseFloat($(this).data('lon1'));
                let lat1 = parseFloat($(this).data('lat1'));
                let descr_spatial = $(this).data('spatial');

                $('.modal-map-title').html(descr_spatial);

                bounds = [[lat0, lon0], [lat1, lon1]];

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



}


function metadataInfo_ORG(dir) {
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

            metadata = result.data.metadata;
            console.log(metadata);

            $('.metadata-info').show();
            mdata = metadata;
/*
            // DATA 
            // THESE 3 ARE ALWAYS PRESENT
            mdata['usr_creator'] = '<SAMENGESTELD>Ik ben de creator';
            mdata['usr_title']='Dit is de title';

            // VANAF HIER IN ROWS
            mdata['usr_description'] = 'BLabli ba ab as abl blabl ba b l a bl ab bla bl ba bla bl a bl bla b l ab la bla bl ab lb  bl ab la b bla bla bc bla bac b blablabads asdbl asdlascbas asda a as as sd asd  asd aqsd asd asd asd asd asd asd asd asd asd asd asd asd asd';

            // Alle beschikbare attributen worden opgehaald
            // Deze worden daarna 1 voor 1 geprocessed.
            // bij ophalen van alle attributen wordt usr_tag_0, usr_tag_1
            //  omgezet in array met de individuele waardes
            mdata['usr_tag']=['tag1', 'tag2', 'tag3']
            mdata['usr_research_group']='RESEARCH GROUP'
            mdata['usr_collection_name'] = 'Collection name Project';
            mdata['usr_research_period'] = '2010-01-01 2020-02-02';

            mdata['usr_personal_data'] = "No";
            mdata['usr_deposit_date'] = '2022-02-22';
            mdata['usr_retention_period'] = "20";

            // Complex structs
            let test = {}
            test['creator_1'] = 'Lazlo Westerhof';
            test['creator_2'] = 'Harm de Raaff';
            test['creator_1_role'] = 'OWNER';
            test['creator_2_role'] = 'CURATOR';

            let key = '';
            let flattened = {};
            for (key in test) {
                 console.log(key);
                 console.log(test[key]);

                 // Samenvoegen op het kleinst aantal tokens
                 let count = key.split('_').length
                 if (count==2){
                     // Top level
                     flattened[key] = test[key];
                 }
                 else {
                     // Sub level 
                     let levelname = '';
                     for (levelname in flattened){
                         if (key.indexOf(levelname)==0) {
                             flattened[levelname] += ' (' + test[key] + ')';
                             break;
                         }
                     }
                 }
            }
            console.log('TOTAAL');
            console.log(flattened);
*/

            // Dit is al geprepared in de view
            let creators = [];
            for (let c in metadata.Creator){
                let fullname = "".concat(metadata.Creator[c].Name.Given_Name, " ", metadata.Creator[c].Name.Family_Name);
                fullname += ' (' + metadata.Creator[c].Owner_Role + ')'
                creators.push(fullname);
            }
            $('.metadata-title').text(metadata['Title']);
            $('.metadata-creator').text(creators.join(', '));

            let description = metadata['Description'];
            let wordCount = description.match(/(\w+)/g). length;
            console.log(wordCount);
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

            // Title/description and creator are always present. 
            // The following are all within rows that are initially hidden
            // to be considered || direct value_key - enumerated (e.g. tags tag0, tag1) - return of function contains html
            $('.metadata').each(function(){
                let dp_attr = $(this).data('dp-attr');
                console.log(dp_attr);

                // Be aware of the fact that direct data is only present when directly addressable in array!
                // I.e. not in complex structures

                let data = metadata[dp_attr];
                let func = mfunction[dp_attr];

                // Sometimes no direct reference 
                if (data || func) {
                    if (func) {
                        if (data) {
                            $(this).text( func( data ) );
                        }
                        else {
                            $(this).text( func() );
                        }
                    }
                    else {
                        // No special function so data is surely plain text
                        $(this).text(data);
                    }
                    $(this).closest('.row').removeClass('hidden');
                }
            });

            return;

/*
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
*/
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
