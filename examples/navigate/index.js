/* global $, isNaN */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(() => {
    // generate data set from a parametric function with a fractal look

    function sumf(f, t, m) {
        var res = 0;
        // eslint-disable-next-line no-plusplus
        for (var i = 1; i < m; ++i) {
            res += f(i * i * t) / (i * i);
        }
        return res;
    }

    var d1 = [];
    for (var t = 0; t <= 2 * Math.PI; t += 0.01) {
        d1.push([sumf(Math.cos, t, 10), sumf(Math.sin, t, 10)]);
    }

    var data = [d1];

    var placeholder = $('#placeholder');

    var plot = $.plot(placeholder, data, {
        series: {
            lines: {
                show: true,
            },
            shadowSize: 0,
        },
        xaxis: {
            zoomRange: [0.1, 10],
            panRange: [-10, 10],
        },
        yaxis: {
            zoomRange: [0.1, 10],
            panRange: [-10, 10],
        },
        zoom: {
            interactive: true,
        },
        pan: {
            interactive: true,
        },
    });

    // show pan/zoom messages to illustrate events

    placeholder.bind('plotpan', (event, _plot) => {
        var axes = _plot.getAxes();
        $('.message').html(`Panning to x: ${axes.xaxis.min.toFixed(2)} &ndash; ${axes.xaxis.max.toFixed(2)} and y: ${axes.yaxis.min.toFixed(2)} &ndash; ${axes.yaxis.max.toFixed(2)}`);
    });

    placeholder.bind('plotzoom', (event, _plot) => {
        var axes = _plot.getAxes();
        $('.message').html(`Zooming to x: ${axes.xaxis.min.toFixed(2)} &ndash; ${axes.xaxis.max.toFixed(2)} and y: ${axes.yaxis.min.toFixed(2)} &ndash; ${axes.yaxis.max.toFixed(2)}`);
    });

    // add zoom out button

    $("<div class='button' style='right:20px;top:20px'>zoom out</div>")
        .appendTo(placeholder)
        .click((event) => {
            event.preventDefault();
            plot.zoomOut();
        });

    // and add panning buttons

    // little helper for taking the repetitive work out of placing
    // panning arrows

    function addArrow(dir, right, top, offset) {
        $(`<img class='button' src='arrow-${dir}.gif' style='right:${right}px;top:${top}px'>`)
            .appendTo(placeholder)
            .click((e) => {
                e.preventDefault();
                plot.pan(offset);
            });
    }

    addArrow('left', 55, 60, { left: -100 });
    addArrow('right', 25, 60, { left: 100 });
    addArrow('up', 40, 45, { top: -100 });
    addArrow('down', 40, 75, { top: 100 });

    // Add the Flot version string to the footer

    $('#footer').prepend(`Flot ${$.plot.version} &ndash; `);
});
