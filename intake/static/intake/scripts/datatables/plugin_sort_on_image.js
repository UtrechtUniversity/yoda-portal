/*
This plugin is derived from http://cdn.datatables.net/plug-ins/1.10.6/sorting/alt-string.js
It makes sorting on the title of an html element possible.
In this case the div's that reside in the cells of a table column.
 */

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "alt-string-pre": function ( a ) {
        return a.match(/title="(.*?)"/)[1].toLowerCase();
    },

    "alt-string-asc": function( a, b ) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },

    "alt-string-desc": function(a,b) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
});
