/* global $, isNaN */
/* eslint-disable vars-on-top, no-var  */
// eslint-disable-next-line prefer-arrow-callback
$(() => {
    var sin = [];
    var cos = [];

    for (var i = 0; i < 14; i += 0.5) {
        sin.push([i, Math.sin(i)]);
        cos.push([i, Math.cos(i)]);
    }

    var plot = $.plot('#placeholder', [
        { data: sin, label: 'sin(x)' },
        { data: cos, label: 'cos(x)' },
    ], {
        series: {
            lines: {
                show: true,
            },
            points: {
                show: true,
            },
        },
        grid: {
            hoverable: true,
            clickable: true,
        },
        yaxis: {
            min: -1.2,
            max: 1.2,
        },
    });

    $("<div id='tooltip'></div>").css({
        position: 'absolute',
        display: 'none',
        border: '1px solid #fdd',
        padding: '2px',
        'background-color': '#fee',
        opacity: 0.80,
    }).appendTo('body');

    $('#placeholder').bind('plothover', (event, pos, item) => {
        if ($('#enablePosition:checked').length > 0) {
            var str = `(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`;
            $('#hoverdata').text(str);
        }

        if ($('#enableTooltip:checked').length > 0) {
            if (item) {
                var x = item.datapoint[0].toFixed(2);


                var y = item.datapoint[1].toFixed(2);

                $('#tooltip').html(`${item.series.label} of ${x} = ${y}`)
                    .css({ top: item.pageY + 5, left: item.pageX + 5 })
                    .fadeIn(200);
            } else {
                $('#tooltip').hide();
            }
        }
    });

    $('#placeholder').bind('plotclick', (event, pos, item) => {
        if (item) {
            $('#clickdata').text(` - click point ${item.dataIndex} in ${item.series.label}`);
            plot.highlight(item.series, item.datapoint);
        }
    });

    // Add the Flot version string to the footer

    $('#footer').prepend(`Flot ${$.plot.version} &ndash; `);
});
