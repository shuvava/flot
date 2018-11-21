/* Flot plugin for computing bottoms for filled line and bar charts.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

The case: you've got two series that you want to fill the area between. In Flot
terms, you need to use one as the fill bottom of the other. You can specify the
bottom of each data point as the third coordinate manually, or you can use this
plugin to compute it for you.

In order to name the other series, you need to give it an id, like this:

    var dataset = [
        { data: [ ... ], id: "foo" } ,         // use default bottom
    { data: [ ... ], fillBetween: "foo" }, // use first dataset as bottom
    ];

    $.plot($("#placeholder"), dataset, { lines: { show: true, fill: true }});

As a convenience, if the id given is a number that doesn't appear as an id in
the series, it is interpreted as the index in the array instead (so fillBetween:
0 can also mean the first series).

Internally, the plugin modifies the datapoints in each series. For line series,
extra data points might be inserted through interpolation. Note that at points
where the bottom line is not defined (due to a null point or start/end of line),
the current line will show a gap too. The algorithm comes from the
jquery.flot.stack.js plugin, possibly some code could be shared.

*/
// import forEach from 'lodash/forEach';
import findIndex from 'lodash/findIndex';
import isNumber from 'lodash/isNumber';

const _MODE_TYPE_ = 'fillbetween';

const options = {
    series: {
        fillBetween: null, // or number
    },
};

/**
 * ????
 * @param {*} series options(settings) of axises
 * @param {*} plotData axis type
 */
function findBottomSeries(series, plotData) {
    const index = findIndex(plotData, item => item.id === series.fillBetween);
    if (index > -1) {
        return plotData[index];
    }

    if (isNumber(series.fillBetween)) {
        if (series.fillBetween < 0 || series.fillBetween >= plotData.length) {
            return null;
        }
        return plotData[series.fillBetween];
    }

    return null;
}

function computeFillBottoms(plot, series, dataPoints) {
    if (series.fillBetween == null) {
        return;
    }

    const other = findBottomSeries(series, plot.getData());

    if (!other) {
        return;
    }
    const { pointsize: ps, points } = dataPoints;
    const { pointsize: otherps, points: otherpoints } = other.datapoints;
    const newpoints = [];

    const withlines = series.lines.show;
    const withbottom = ps > 2 && dataPoints.format[2].y;
    const withsteps = withlines && series.lines.steps;


    let fromgap = true;
    let i = 0;
    let j = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (i >= points.length) {
            break;
        }

        const len = newpoints.length;

        if (points[i] == null) {
            // copy gaps
            for (let m = 0; m < ps; m += 1) {
                newpoints.push(points[i + m]);
            }

            i += ps;
        } else if (j >= otherpoints.length) {
            // for lines, we can't use the rest of the points
            if (!withlines) {
                for (let m = 0; m < ps; m += 1) {
                    newpoints.push(points[i + m]);
                }
            }

            i += ps;
        } else if (otherpoints[j] == null) {
            // oops, got a gap
            for (let m = 0; m < ps; m += 1) {
                newpoints.push(null);
            }

            fromgap = true;
            j += otherps;
        } else {
            // cases where we actually got two points

            const px = points[i];
            const py = points[i + 1];
            const qx = otherpoints[j];
            const qy = otherpoints[j + 1];
            let bottom = 0;
            if (px === qx) {
                for (let m = 0; m < ps; m += 1) {
                    newpoints.push(points[i + m]);
                }

                // newpoints[ l + 1 ] += qy;
                bottom = qy;
                i += ps;
                j += otherps;
            } else if (px > qx) {
                // we got past point below, might need to
                // insert interpolated extra point

                if (withlines && i > 0 && points[i - ps] != null) {
                    const intery = py + (points[i - ps + 1] - py) * (qx - px) / (points[i - ps] - px);
                    newpoints.push(qx);
                    newpoints.push(intery);
                    for (let m = 2; m < ps; m += 1) {
                        newpoints.push(points[i + m]);
                    }
                    bottom = qy;
                }

                j += otherps;
            } else { // px < qx
                // if we come from a gap, we just skip this point

                if (fromgap && withlines) {
                    i += ps;
                    continue;
                }

                for (let m = 0; m < ps; m += 1) {
                    newpoints.push(points[i + m]);
                }

                // we might be able to interpolate a point below,
                // this can give us a better y
                if (withlines && j > 0 && otherpoints[j - otherps] != null) {
                    bottom = qy + (otherpoints[j - otherps + 1] - qy) * (px - qx) / (otherpoints[j - otherps] - qx);
                }

                // newpoints[l + 1] += bottom;
                i += ps;
            }

            fromgap = false;

            if (len !== newpoints.length && withbottom) {
                newpoints[len + 2] = bottom;
            }
        }

        // maintain the line steps invariant

        if (withsteps && len !== newpoints.length && len > 0
            && newpoints[len] !== null
            && newpoints[len] !== newpoints[len - ps]
            && newpoints[len + 1] !== newpoints[len - ps + 1]) {
            for (let m = 0; m < ps; m += 1) {
                newpoints[len + ps + m] = newpoints[len + m];
            }
            newpoints[len + 1] = newpoints[len - ps + 1];
        }
    }

    dataPoints.points = newpoints;
}

/**
 * Initialization of plugin
 * @param {*} plot chart object
 */
function init(plot) {
    plot.hooks.processDatapoints.push(computeFillBottoms);
}

// add plugin into plot object
export default Object.freeze({
    init: init,
    options: options,
    name: _MODE_TYPE_,
    version: '1.0',
});
