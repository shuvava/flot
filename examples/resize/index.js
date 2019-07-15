/* global $, isNaN */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(document).ready(function main() {
    var d1 = [];
    for (var i = 0; i < 14; i += 0.5) {
        d1.push([i, Math.sin(i)]);
    }

    var d2 = [[0, 3], [4, 8], [8, 5], [9, 13]];
    var d3 = [[0, 12], [7, 12], null, [7, 2.5], [12, 2.5]];

    var placeholder = $('#placeholder');
    var plot = $.plot(placeholder[0], [d1, d2, d3]);

    // The plugin includes a jQuery plugin for adding resize events to any
    // element.  Add a callback so we can display the placeholder size.

    placeholder.resize(function showMessage() {
        $('.message').text(`Placeholder is now ${$(this).width()}x${$(this).height()} pixels`);
    });

    $('.demo-container').resizable({
        maxWidth: 900,
        maxHeight: 500,
        minWidth: 450,
        minHeight: 250,
    });

    // Add the Flot version string to the footer

    $('#footer').prepend(`Flot ${$.plot.version} &ndash;`);
});
