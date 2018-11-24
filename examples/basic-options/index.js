/* global $, isNaN */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(function main() {
    var d1 = [];
    for (let i = 0; i < Math.PI * 2; i += 0.25) {
        d1.push([i, Math.sin(i)]);
    }

    var d2 = [];
    for (let i = 0; i < Math.PI * 2; i += 0.25) {
        d2.push([i, Math.cos(i)]);
    }

    var d3 = [];
    for (let i = 0; i < Math.PI * 2; i += 0.1) {
        d3.push([i, Math.tan(i)]);
    }

    $.plot('#placeholder', [
        { label: 'sin(x)', data: d1 },
        { label: 'cos(x)', data: d2 },
        { label: 'tan(x)', data: d3 },
    ], {
        series: {
            lines: { show: true },
            points: { show: true },
        },
        xaxis: {
            ticks: [
                0, [Math.PI / 2, '\u03c0/2'], [Math.PI, '\u03c0'],
                [Math.PI * 3 / 2, '3\u03c0/2'], [Math.PI * 2, '2\u03c0'],
            ],
        },
        yaxis: {
            ticks: 10,
            min: -2,
            max: 2,
            tickDecimals: 3,
        },
        grid: {
            backgroundColor: { colors: ['#fff', '#eee'] },
            borderWidth: {
                top: 1,
                right: 1,
                bottom: 2,
                left: 2,
            },
        },
    });

    // Add the Flot version string to the footer

    $('#footer').prepend(`Flot ${$.plot.version} &ndash; `);
});
