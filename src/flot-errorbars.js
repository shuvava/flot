/* Flot plugin for plotting error bars.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

Error bars are used to show standard deviation and other statistical
properties in a plot.

* Created by Rui Pereira  -  rui (dot) pereira (at) gmail (dot) com

This plugin allows you to plot error-bars over points. Set "errorbars" inside
the points series to the axis name over which there will be error values in
your data array (*even* if you do not intend to plot them later, by setting
"show: null" on xerr/yerr).

The plugin supports these options:

    series: {
        points: {
            errorbars: "x" or "y" or "xy",
            xerr: {
                show: null/false or true,
                asymmetric: null/false or true,
                upperCap: null or "-" or function,
                lowerCap: null or "-" or function,
                color: null or color,
                radius: null or number
            },
            yerr: { same options as xerr }
        }
    }

Each data point array is expected to be of the type:

    "x"  [ x, y, xerr ]
    "y"  [ x, y, yerr ]
    "xy" [ x, y, xerr, yerr ]

Where xerr becomes xerr_lower,xerr_upper for the asymmetric error case, and
equivalently for yerr. Eg., a datapoint for the "xy" case with symmetric
error-bars on X and asymmetric on Y would be:

    [ x, y, xerr, yerr_lower, yerr_upper ]

By default no end caps are drawn. Setting upperCap and/or lowerCap to "-" will
draw a small cap perpendicular to the error bar. They can also be set to a
user-defined drawing function, with (ctx, x, y, radius) as parameters, as eg.

    function drawSemiCircle( ctx, x, y, radius ) {
        ctx.beginPath();
        ctx.arc( x, y, radius, 0, Math.PI, false );
        ctx.moveTo( x - radius, y );
        ctx.lineTo( x + radius, y );
        ctx.stroke();
    }

Color and radius both default to the same ones of the points series if not
set. The independent radius parameter on xerr/yerr is useful for the case when
we may want to add error-bars to a line, without showing the interconnecting
points (with radius: 0), and still showing end caps on the error-bars.
shadowSize and lineWidth are derived as well from the points series.

*/

const _MODE_TYPE_ = 'errorbars';

const options = {
    series: {
        points: {
            errorbars: null, // should be 'x', 'y' or 'xy'
            xerr: {
                err: 'x',
                show: null,
                asymmetric: null,
                upperCap: null,
                lowerCap: null,
                color: null,
                radius: null,
            },
            yerr: {
                err: 'y',
                show: null,
                asymmetric: null,
                upperCap: null,
                lowerCap: null,
                color: null,
                radius: null,
            },
        },
    },
};

function drawPath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let p = 1; p < pts.length; p += 1) {
        ctx.lineTo(pts[p][0], pts[p][1]);
    }
    ctx.stroke();
}

function drawError(ctx, err, x, y, upper, lower, drawUpper, drawLower, radius, offset, minmax) {
    // shadow offset
    y += offset;
    upper += offset;
    lower += offset;

    // error bar - avoid plotting over circles
    if (err.err === 'x') {
        if (upper > x + radius) drawPath(ctx, [[upper, y], [Math.max(x + radius, minmax[0]), y]]);
        else drawUpper = false;
        if (lower < x - radius) drawPath(ctx, [[Math.min(x - radius, minmax[1]), y], [lower, y]]);
        else drawLower = false;
    } else {
        if (upper < y - radius) drawPath(ctx, [[x, upper], [x, Math.min(y - radius, minmax[0])]]);
        else drawUpper = false;
        if (lower > y + radius) drawPath(ctx, [[x, Math.max(y + radius, minmax[1])], [x, lower]]);
        else drawLower = false;
    }

    // internal radius value in errorbar, allows to plot radius 0 points and still keep proper sized caps
    // this is a way to get errorbars on lines without visible connecting dots
    radius = err.radius != null ? err.radius : radius;

    // upper cap
    if (drawUpper) {
        if (err.upperCap === '-') {
            if (err.err === 'x') drawPath(ctx, [[upper, y - radius], [upper, y + radius]]);
            else drawPath(ctx, [[x - radius, upper], [x + radius, upper]]);
        } else if (typeof err.upperCap === 'function') {
            if (err.err === 'x') err.upperCap(ctx, upper, y, radius);
            else err.upperCap(ctx, x, upper, radius);
        }
    }
    // lower cap
    if (drawLower) {
        if (err.lowerCap === '-') {
            if (err.err === 'x') drawPath(ctx, [[lower, y - radius], [lower, y + radius]]);
            else drawPath(ctx, [[x - radius, lower], [x + radius, lower]]);
        } else if (typeof err.lowerCap === 'function') {
            if (err.err === 'x') err.lowerCap(ctx, lower, y, radius);
            else err.lowerCap(ctx, x, lower, radius);
        }
    }
}

function processRawData(plot, series, data, datapoints) {
    if (!series.points.errorbars) { return; }

    // x,y values
    const format = [
        { x: true, number: true, required: true },
        { y: true, number: true, required: true },
    ];

    const errors = series.points.errorbars;
    // error bars - first X then Y
    if (errors === 'x' || errors === 'xy') {
        // lower / upper error
        if (series.points.xerr.asymmetric) {
            format.push({ x: true, number: true, required: true });
            format.push({ x: true, number: true, required: true });
        } else {
            format.push({ x: true, number: true, required: true });
        }
    }
    if (errors === 'y' || errors === 'xy') {
        // lower / upper error
        if (series.points.yerr.asymmetric) {
            format.push({ y: true, number: true, required: true });
            format.push({ y: true, number: true, required: true });
        } else {
            format.push({ y: true, number: true, required: true });
        }
    }
    datapoints.format = format;
}

function parseErrors(series, i) {
    const { points } = series.datapoints;

    // read errors from points array
    let exl = null;
    let exu = null;
    let eyl = null;
    let eyu = null;
    const { xerr } = series.points;
    const { yerr } = series.points;

    const eb = series.points.errorbars;
    // error bars - first X
    if (eb === 'x' || eb === 'xy') {
        if (xerr.asymmetric) {
            exl = points[i + 2];
            exu = points[i + 3];
            if (eb === 'xy') {
                if (yerr.asymmetric) {
                    eyl = points[i + 4];
                    eyu = points[i + 5];
                } else {
                    eyl = points[i + 4];
                }
            }
        } else {
            exl = points[i + 2];
            if (eb === 'xy') {
                if (yerr.asymmetric) {
                    eyl = points[i + 3];
                    eyu = points[i + 4];
                } else {
                    eyl = points[i + 3];
                }
            }
        }
    // only Y
    } else if (eb === 'y') {
        if (yerr.asymmetric) {
            eyl = points[i + 2];
            eyu = points[i + 3];
        } else eyl = points[i + 2];
    }

    // symmetric errors?
    if (exu == null) exu = exl;
    if (eyu == null) eyu = eyl;

    const errRanges = [exl, exu, eyl, eyu];
    // nullify if not showing
    if (!xerr.show) {
        errRanges[0] = null;
        errRanges[1] = null;
    }
    if (!yerr.show) {
        errRanges[2] = null;
        errRanges[3] = null;
    }
    return errRanges;
}

function drawSeriesErrors(plot, ctx, s) {
    const { points } = s.datapoints;
    const ps = s.datapoints.pointsize;
    const ax = [s.xaxis, s.yaxis];
    const { radius } = s.points;
    const err = [s.points.xerr, s.points.yerr];

    // sanity check, in case some inverted axis hack is applied to flot
    let invertX = false;
    if (ax[0].p2c(ax[0].max) < ax[0].p2c(ax[0].min)) {
        invertX = true;
        const tmp = err[0].lowerCap;
        err[0].lowerCap = err[0].upperCap;
        err[0].upperCap = tmp;
    }

    let invertY = false;
    if (ax[1].p2c(ax[1].min) < ax[1].p2c(ax[1].max)) {
        invertY = true;
        const tmp = err[1].lowerCap;
        err[1].lowerCap = err[1].upperCap;
        err[1].upperCap = tmp;
    }

    for (let i = 0; i < s.datapoints.points.length; i += ps) {
        // parse
        const errRanges = parseErrors(s, i);

        // cycle xerr & yerr
        for (let e = 0; e < err.length; e += 1) {
            const minmax = [ax[e].min, ax[e].max];

            // draw this error?
            if (errRanges[e * err.length]) {
                // data coordinates
                let x = points[i];
                let y = points[i + 1];

                // errorbar ranges
                let upper = [x, y][e] + errRanges[e * err.length + 1];
                let lower = [x, y][e] - errRanges[e * err.length];

                // points outside of the canvas
                if (err[e].err === 'x') {
                    if (y > ax[1].max || y < ax[1].min || upper < ax[0].min || lower > ax[0].max) { continue; }
                }
                if (err[e].err === 'y') {
                    if (x > ax[0].max || x < ax[0].min || upper < ax[1].min || lower > ax[1].max) { continue; }
                }

                // prevent errorbars getting out of the canvas
                let drawUpper = true;
                let drawLower = true;

                if (upper > minmax[1]) {
                    drawUpper = false;
                    // eslint-disable-next-line prefer-destructuring
                    upper = minmax[1];
                }
                if (lower < minmax[0]) {
                    drawLower = false;
                    // eslint-disable-next-line prefer-destructuring
                    lower = minmax[0];
                }

                // sanity check, in case some inverted axis hack is applied to flot
                if ((err[e].err === 'x' && invertX) || (err[e].err === 'y' && invertY)) {
                    // swap coordinates
                    let tmp = lower;
                    lower = upper;
                    upper = tmp;
                    tmp = drawLower;
                    drawLower = drawUpper;
                    drawUpper = tmp;
                    // eslint-disable-next-line prefer-destructuring
                    tmp = minmax[0];
                    // eslint-disable-next-line prefer-destructuring
                    minmax[0] = minmax[1];
                    minmax[1] = tmp;
                }

                // convert to pixels
                x = ax[0].p2c(x);
                y = ax[1].p2c(y);
                upper = ax[e].p2c(upper);
                lower = ax[e].p2c(lower);
                minmax[0] = ax[e].p2c(minmax[0]);
                minmax[1] = ax[e].p2c(minmax[1]);

                // same style as points by default
                const lw = err[e].lineWidth ? err[e].lineWidth : s.points.lineWidth;
                const sw = s.points.shadowSize != null ? s.points.shadowSize : s.shadowSize;

                // shadow as for points
                if (lw > 0 && sw > 0) {
                    const w = sw / 2;
                    ctx.lineWidth = w;
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                    drawError(ctx, err[e], x, y, upper, lower, drawUpper, drawLower, radius, w + w / 2, minmax);

                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    drawError(ctx, err[e], x, y, upper, lower, drawUpper, drawLower, radius, w / 2, minmax);
                }

                ctx.strokeStyle = err[e].color ? err[e].color : s.color;
                ctx.lineWidth = lw;
                // draw it
                drawError(ctx, err[e], x, y, upper, lower, drawUpper, drawLower, radius, 0, minmax);
            }
        }
    }
}


function draw(plot, ctx) {
    const plotOffset = plot.getPlotOffset();

    ctx.save();
    ctx.translate(plotOffset.left, plotOffset.top);
    plot.getData().forEach((s) => {
        if (s.points.errorbars && (s.points.xerr.show || s.points.yerr.show)) {
            drawSeriesErrors(plot, ctx, s);
        }
    });
    ctx.restore();
}

/**
 * Initialization of plugin
 * @param {*} plot chart object
 */
function init(plot) {
    plot.hooks.processRawData.push(processRawData);
    plot.hooks.draw.push(draw);
}

// add plugin into plot object
export default Object.freeze({
    init: init,
    options: options,
    name: _MODE_TYPE_,
    version: '1.0',
});
