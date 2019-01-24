/* global $, isNaN */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(() => {
    var data = [[['hs-2004-27-a-large-web.jpg', -10, -10, 10, 10]]];

    var options = {
        series: {
            images: {
                show: true,
            },
        },
        xaxis: {
            min: -8,
            max: 4,
        },
        yaxis: {
            min: -8,
            max: 4,
        },
    };

    $.plot.image.loadDataImages(data, options, () => {
        $.plot('#placeholder', data, options);
    });

    // Add the Flot version string to the footer

    $('#footer').prepend(`Flot ${$.plot.version} &ndash; `);
});
