/* global $, isNaN */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(document).ready(function main() {
    var d1 = [];
    for (let i = 0; i <= 10; i += 1) {
        d1.push([i, parseInt(Math.random() * 30, 10)]);
    }

    var d2 = [];
    for (let i = 0; i <= 10; i += 1) {
        d2.push([i, parseInt(Math.random() * 30, 10)]);
    }

    var d3 = [];
    for (var i = 0; i <= 10; i += 1) {
        d3.push([i, parseInt(Math.random() * 30, 10)]);
    }

    var stack = 0;

    let bars = true;
    let lines = false;
    let steps = false;

    function plotWithOptions() {
        $.plot('#placeholder', [d1, d2, d3], {
            series: {
                stack: stack,
                lines: {
                    show: lines,
                    fill: true,
                    steps: steps,
                },
                bars: {
                    show: bars,
                    barWidth: 0.6,
                },
            },
        });
    }

    plotWithOptions();

    $('.stackControls button').click(function stackControlsClick(e) {
        e.preventDefault();
        stack = $(this).text() === 'With stacking' ? true : null;
        plotWithOptions();
    });

    $('.graphControls button').click(function graphControlsClick(e) {
        e.preventDefault();
        bars = $(this).text().indexOf('Bars') !== -1;
        lines = $(this).text().indexOf('Lines') !== -1;
        steps = $(this).text().indexOf('steps') !== -1;
        plotWithOptions();
    });

    // Add the Flot version string to the footer

    $('#footer').prepend(`Flot ${$.plot.version} &ndash; `);
});
