/* global $, isNaN */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(function main() {
    function generate(start, end, fn) {
        var res = [];
        for (var i = 0; i <= 100; i += 1) {
            var x = start + i / 100 * (end - start);
            res.push([x, fn(x)]);
        }
        return res;
    }

    var data = [
        { data: generate(0, 10, x => Math.sqrt(x)), xaxis: 1, yaxis: 1 },
        { data: generate(0, 10, x => Math.sin(x)), xaxis: 1, yaxis: 2 },
        { data: generate(0, 10, x => Math.cos(x)), xaxis: 1, yaxis: 3 },
        { data: generate(2, 10, x => Math.tan(x)), xaxis: 2, yaxis: 4 },
    ];

    var plot = $.plot('#placeholder', data, {
        xaxes: [
            { position: 'bottom' },
            { position: 'top' },
        ],
        yaxes: [
            { position: 'left' },
            { position: 'left' },
            { position: 'right' },
            { position: 'left' },
        ],
    });

    // Create a div for each axis

    $.each(plot.getAxes(), (i, axis) => {
        if (!axis.show) { return; }

        var box = axis.box;

        $(`<div class='axisTarget' style='position:absolute; left:${box.left}px; top:${box.top}px; width:${box.width}px; height:${box.height}px'></div>`)
            .data('axis.direction', axis.direction)
            .data('axis.n', axis.n)
            .css({ backgroundColor: '#f00', opacity: 0, cursor: 'pointer' })
            .appendTo(plot.getPlaceholder())
            .hover(
                function () { $(this).css({ opacity: 0.10 }); },
                function () { $(this).css({ opacity: 0 }); },
            )
            .click(() => {
                $('#click').text(`You clicked the ${axis.direction}${axis.n }axis!`);
            });
    });

    // Add the Flot version string to the footer

    $('#footer').prepend(`Flot ${$.plot.version} &ndash; `);
});
