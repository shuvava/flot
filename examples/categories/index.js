/* global $, isNaN */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(function main() {
    var data = [['January', 10], ['February', 8], ['March', 4], ['April', 13], ['May', 17], ['June', 9]];

    $.plot('#placeholder', [data], {
        series: {
            bars: {
                show: true,
                barWidth: 0.6,
                align: 'center',
            },
        },
        xaxis: {
            mode: 'categories',
            tickLength: 0,
        },
    });

    // Add the Flot version string to the footer
    $('#footer').prepend(`Flot ${$.plot.version} &ndash;`);
});
