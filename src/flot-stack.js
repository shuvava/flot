/**
 * The plugin assumes the data is sorted on x (or y if stacking horizontally).
 * For line charts, it is assumed that if a line has an undefined gap (from a
 * null point), then the line above it should have the same gap - insert zeros
 * instead of "null" if you want another behaviour. This also holds for the start
 * and end of the chart. Note that stacking a mix of positive and negative values
 * in most instances doesn't make sense (so it looks weird).
 *
 * Two or more series are stacked when their "stack" attribute is set to the same
 * key (which can be any number or string or just "true"). To specify the default
 * stack, you can set the stack option like this:
 *
 *  series: {
 *      stack: null/false, true, or a key (number/string)
 * }
 *
 * You can also specify it for a single series, like this:
 *
 *  $.plot( $("#placeholder"), [{
 *      data: [ ... ],
 *      stack: true
 *  }])
 *
 * The stacking order is determined by the order of the data series in the array
 * (later series end up on top of the previous).
 *
 * Internally, the plugin modifies the datapoints in each series, adding an
 * offset to the y value. For line series, extra data points are inserted through
 * interpolation. If there's a second y value, it's also adjusted (e.g for bar charts or filled areas).
 */
import $ from 'jquery';
import 'Flot';

const _MODE_TYPE_ = 'stack';

const options = {
    series: { stack: null }, // or number/string
};

function findPreviousStackSeries(axis, allSeries) {
    let result = null;
    for (let i = 0; i < allSeries.length; i += 1) {
        if (axis === allSeries[i]) {
            break;
        }
        if (allSeries[i].stack === axis.stack) {
            result = allSeries[i];
        }
    }
    return result;
}

function processDatapoints(plot, series, dataPoints) {
    if (!series.stack) {
        return;
    }
    const other = findPreviousStackSeries(series, plot.getData());
    const { pointsize: pointSize, points } = dataPoints;
    const { pointsize: otherps, points: otherpoints } = other.datapoints;
    const withlines = series.lines.show;
    const { horizontal } = series.bars;
    const withbottom = pointSize > 2 && (horizontal ? dataPoints.format[2].x : dataPoints.format[2].y);
    const withsteps = withlines && series.lines.steps;
    const keyOffset = horizontal ? 1 : 0;
    const accumulateOffset = horizontal ? 0 : 1;
    const newpoints = [];

    let fromgap = true;
    let i = 0;// index in current series with stack
    let j = 0;// index in previous series with stack

    while (true) {
        if (i >= points.length) {
            break;
        }
        const _len = newpoints.length;

        if (points[i] === null) {
            // copy gaps
            for (let m = 0; m < pointSize; m += 1) {
                newpoints.push(points[i + m]);
                i += pointSize;
            }
        } else if (otherpoints[j] == null) {
            // copy gaps
            for (let m = 0; m < pointSize; m += 1) {
                newpoints.push(null);
            }
            fromgap = true;
            j += otherps;
        } else if (j >= otherpoints.length) {
            // for lines, we can't use the rest of the points
            if (!withlines) {
                for (let m = 0; m < pointSize; m += 1) {
                    newpoints.push(points[i + m]);
                }
            }
            i += pointSize;
        } else {
            // cases where we actually got two points
            const px = points[i + keyOffset];
            const py = points[i + accumulateOffset];
            const qx = otherpoints[j + keyOffset];
            const qy = otherpoints[j + accumulateOffset];
            let bottom = 0;

            if (px === qx) {
                for (let m = 0; m < pointSize; m += 1) {
                    newpoints.push(points[i + m]);
                }

                newpoints[_len + accumulateOffset] += qy;
                bottom = qy;

                i += pointSize;
                j += otherps;
            } else if (px > qx) {
                // we got past point below, might need to
                // insert interpolated extra point
                if (withlines && i > 0 && points[i - pointSize] != null) {
                    const intery = py + (points[i - pointSize + accumulateOffset] - py) * (qx - px) / (points[i - pointSize + keyOffset] - px);
                    newpoints.push(qx);
                    newpoints.push(intery + qy);
                    for (let m = 2; m < pointSize; m += 1) {
                        newpoints.push(points[i + m]);
                    }
                    bottom = qy;
                }

                j += otherps;
            } else { // px < qx
                if (fromgap && withlines) {
                    // if we come from a gap, we just skip this point
                    i += pointSize;
                    continue;
                }
                for (let m = 0; m < pointSize; m += 1) {
                    newpoints.push(points[i + m]);
                }

                // we might be able to interpolate a point below,
                // this can give us a better y
                if (withlines && j > 0 && otherpoints[j - otherps] != null) {
                    bottom = qy + (otherpoints[j - otherps + accumulateOffset] - qy) * (px - qx) / (otherpoints[j - otherps + keyOffset] - qx);
                }
                newpoints[_len + accumulateOffset] += bottom;

                i += pointSize;
            }

            fromgap = false;
            if (_len !== newpoints.length && withbottom) {
                newpoints[_len + 2] += bottom;
            }
        }

        // maintain the line steps invariant
        if (withsteps && _len !== newpoints.length && _len > 0
            && newpoints[_len] !== null
            && newpoints[_len] !== newpoints[_len - pointSize]
            && newpoints[_len + 1] !== newpoints[_len - pointSize + 1]) {
            for (let m = 0; m < pointSize; m += 1) {
                newpoints[_len + pointSize + m] = newpoints[_len + m];
            }
            newpoints[_len + 1] = newpoints[_len - pointSize + 1];
        }
    }

    dataPoints.points = newpoints;
}

/**
 * Initialization of plugin
 * @param {*} plot chart object
 */
function init(plot) {
    plot.hooks.processDatapoints.push(processDatapoints);
}

// add plugin into plot object
$.plot.plugins.push({
    init: init,
    options: options,
    name: _MODE_TYPE_,
    version: '1.0',
});
