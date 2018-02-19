import ColorHelper from './colorhelper';

function axisNumber(obj, coord) {
    let axis = obj[`${coord}axis`];
    if (typeof axis === 'object') { // if we got a real axis, extract number
        axis = axis.n;
    }
    if (typeof axis !== 'number') { // default to first axis
        axis = 1;
    }
    return axis;
}
function updateAxis(axis, min, max) {
    if (min < axis.datamin && min !== -Number.MAX_VALUE) {
        axis.datamin = min;
    }
    if (max > axis.datamax && max !== Number.MAX_VALUE) {
        axis.datamax = max;
    }
}

function getBarLeftAlign(series) {
    switch (series.bars.align) {
        case 'left':
            return 0;
        case 'right':
            return -series.bars.barWidth;
        default:// center
            return -series.bars.barWidth / 2;
    }
}

function plotPoints(datapoints, radius, fillStyle, _offset, shadow, axisx, axisy, symbol, ctx) {
    const { points, pointsize: ps } = datapoints;
    for (let i = 0; i < points.length; i += ps) {
        let x = points[i];
        let y = points[i + 1];
        if (x == null || x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max) {
            continue;
        }

        ctx.beginPath();
        x = axisx.p2c(x);
        y = axisy.p2c(y) + _offset;
        if (symbol === 'circle') {
            ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
        } else {
            symbol(ctx, x, y, radius, shadow);
        }
        ctx.closePath();

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        ctx.stroke();
    }
}

function plotLine(datapoints, xoffset, yoffset, axisx, axisy, ctx) {
    const { points, pointsize: ps } = datapoints;
    let prevx = null;
    let prevy = null;
    ctx.beginPath();
    for (let i = ps; i < points.length; i += ps) {
        let x1 = points[i - ps];
        let y1 = points[i - ps + 1];
        let x2 = points[i];
        let y2 = points[i + 1];
        if (x1 == null || x2 == null) {
            continue;
        }

        // clip with ymin
        if (y1 <= y2 && y1 < axisy.min) {
            if (y2 < axisy.min) {
                continue;// line segment is outside
            }
            x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
            y1 = axisy.min;
        } else if (y2 <= y1 && y2 < axisy.min) {
            if (y1 < axisy.min) {
                continue;
            }
            x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
            y2 = axisy.min;
        }

        // clip with ymax
        if (y1 >= y2 && y1 > axisy.max) {
            if (y2 > axisy.max) {
                continue;
            }
            x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
            y1 = axisy.max;
        } else if (y2 >= y1 && y2 > axisy.max) {
            if (y1 > axisy.max) {
                continue;
            }
            x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
            y2 = axisy.max;
        }

        // clip with xmin
        if (x1 <= x2 && x1 < axisx.min) {
            if (x2 < axisx.min) {
                continue;
            }
            y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
            x1 = axisx.min;
        } else if (x2 <= x1 && x2 < axisx.min) {
            if (x1 < axisx.min) {
                continue;
            }
            y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
            x2 = axisx.min;
        }

        // clip with xmax
        if (x1 >= x2 && x1 > axisx.max) {
            if (x2 > axisx.max) {
                continue;
            }
            y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
            x1 = axisx.max;
        } else if (x2 >= x1 && x2 > axisx.max) {
            if (x1 > axisx.max) {
                continue;
            }
            y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
            x2 = axisx.max;
        }

        if (x1 !== prevx || y1 !== prevy) {
            ctx.moveTo(axisx.p2c(x1) + xoffset, axisy.p2c(y1) + yoffset);
        }

        prevx = x2;
        prevy = y2;
        ctx.lineTo(axisx.p2c(x2) + xoffset, axisy.p2c(y2) + yoffset);
    }
    ctx.stroke();
}

function plotLineArea(datapoints, axisx, axisy, ctx) {
    const { points } = datapoints;
    let { pointsize: ps } = datapoints;
    const bottom = Math.min(Math.max(0, axisy.min), axisy.max);

    let i = 0;
    let ypos = 1;
    let areaOpen = false;
    let segmentEnd = 0;
    let segmentStart = 0;
    let x1;
    let y1;
    let x2;
    let y2;
    let x1old;
    let x2old;

    // we process each segment in two turns, first forward
    // direction to sketch out top, then once we hit the
    // end we go backwards to sketch the bottom
    while (true) {
        if (ps > 0 && i > points.length + ps) {
            break;
        }

        i += ps; // ps is negative if going backwards
        x1 = points[i - ps];
        y1 = points[i - ps + ypos];
        x2 = points[i];
        y2 = points[i + ypos];

        if (areaOpen) {
            if (ps > 0 && x1 != null && x2 == null) {
                // at turning point
                segmentEnd = i;
                ps = -ps;
                ypos = 2;
                continue;
            }

            if (ps < 0 && i === segmentStart + ps) {
                // done with the reverse sweep
                ctx.fill();
                areaOpen = false;
                ps = -ps;
                ypos = 1;
                segmentStart = segmentEnd + ps;
                i = segmentStart;
                continue;
            }
        }
        if (x1 == null || x2 == null) {
            continue;
        }

        // clip x values

        // clip with xmin
        if (x1 <= x2 && x1 < axisx.min) {
            if (x2 < axisx.min) {
                continue;
            }
            y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
            x1 = axisx.min;
        } else if (x2 <= x1 && x2 < axisx.min) {
            if (x1 < axisx.min) {
                continue;
            }
            y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
            x2 = axisx.min;
        }

        // clip with xmax
        if (x1 >= x2 && x1 > axisx.max) {
            if (x2 > axisx.max) {
                continue;
            }
            y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
            x1 = axisx.max;
        } else if (x2 >= x1 && x2 > axisx.max) {
            if (x1 > axisx.max) {
                continue;
            }
            y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
            x2 = axisx.max;
        }

        if (!areaOpen) {
            // open area
            ctx.beginPath();
            ctx.moveTo(axisx.p2c(x1), axisy.p2c(bottom));
            areaOpen = true;
        }

        // now first check the case where both is outside
        if (y1 >= axisy.max && y2 >= axisy.max) {
            ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.max));
            ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.max));
            continue;
        } else if (y1 <= axisy.min && y2 <= axisy.min) {
            ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.min));
            ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.min));
            continue;
        }

        // else it's a bit more complicated, there might
        // be a flat maxed out rectangle first, then a
        // triangular cutout or reverse; to find these
        // keep track of the current x values
        x1old = x1;
        x2old = x2;

        // clip the y values, without shortcutting, we
        // go through all cases in turn

        // clip with ymin
        if (y1 <= y2 && y1 < axisy.min && y2 >= axisy.min) {
            x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
            y1 = axisy.min;
        } else if (y2 <= y1 && y2 < axisy.min && y1 >= axisy.min) {
            x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
            y2 = axisy.min;
        }

        // clip with ymax
        if (y1 >= y2 && y1 > axisy.max && y2 <= axisy.max) {
            x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
            y1 = axisy.max;
        } else if (y2 >= y1 && y2 > axisy.max && y1 <= axisy.max) {
            x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
            y2 = axisy.max;
        }

        // if the x value was changed we got a rectangle
        // to fill
        if (x1 !== x1old) {
            ctx.lineTo(axisx.p2c(x1old), axisy.p2c(y1));
            // it goes to (x1, y1), but we fill that below
        }

        // fill triangular section, this sometimes result
        // in redundant points if (x1, y1) hasn't changed
        // from previous line to, but we just ignore that
        ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));
        ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));

        // fill the other rectangle if it's there
        if (x2 !== x2old) {
            ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
            ctx.lineTo(axisx.p2c(x2old), axisy.p2c(y2));
        }
    }
}

function getColorOrGradient(spec, bottom, top, defaultColor, ctx) {
    if (typeof spec === 'string') {
        return spec;
    }
    // assume this is a gradient spec; IE currently only
    // supports a simple vertical gradient properly, so that's
    // what we support too
    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    for (let i = 0, l = spec.colors.length; i < l; i += 1) {
        let c = spec.colors[i];
        if (typeof c !== 'string') {
            let co = new ColorHelper(defaultColor);
            if (c.brightness != null) {
                co = co.scale('rgb', c.brightness);
            }
            if (c.opacity != null) {
                co.a *= c.opacity;
            }
            c = co.toString();
        }
        gradient.addColorStop(i / (l - 1), c);
    }
    return gradient;
}

function getFillStyle(filloptions, seriesColor, bottom, top, ctx) {
    const { fill, fillColor } = filloptions;
    if (!fill) {
        return null;
    }

    if (fillColor) {
        return getColorOrGradient(fillColor, bottom, top, seriesColor, ctx);
    }
    const c = new ColorHelper(seriesColor);
    c.a = typeof fill === 'number' ? fill : 0.4;
    c.normalize();
    return c.toString();
}

function setRange(axis) {
    const { options: opts } = axis;
    let min = +(opts.min != null ? opts.min : axis.datamin);
    let max = +(opts.max != null ? opts.max : axis.datamax);
    const delta = max - min;

    if (delta === 0.0) {
        // degenerate case
        const widen = max === 0 ? 1 : 0.01;
        if (opts.min == null) {
            min -= widen;
        }
        // always widen max if we couldn't widen min to ensure we
        // don't fall into min == max which doesn't work
        if (opts.max == null || opts.min != null) {
            max += widen;
        }
    } else {
        // consider autoscaling
        const { autoscaleMargin: margin } = opts;
        if (margin != null) {
            if (opts.min == null) {
                min -= delta * margin;
                // make sure we don't go below zero if all values
                // are positive
                if (min < 0 && axis.datamin != null && axis.datamin >= 0) {
                    min = 0;
                }
            }

            if (opts.max == null) {
                max += delta * margin;
                if (max > 0 && axis.datamax != null && axis.datamax <= 0) {
                    max = 0;
                }
            }
        }
    }

    axis.min = min;
    axis.max = max;
}

function extractRange(ranges, coord, axes) {
    let key;
    let from = null;
    let to = null;
    let axis;
    for (let i = 0; i < axes.length; i += 1) {
        axis = axes[i];
        if (axis.direction === coord) {
            key = `${coord}${axis.n}axis`;
            if (!ranges[key] && axis.n === 1) {
                key = `${coord}axis`; // support x1axis as xaxis
            }
            if (ranges[key]) {
                from = ranges[key].from; // eslint-disable-line prefer-destructuring
                to = ranges[key].to; // eslint-disable-line prefer-destructuring
                break;
            }
        }
    }
    // // backwards-compat stuff - to be removed in future
    // if (!ranges[key]) {
    //     axis = coord === 'x' ? xaxes[0] : yaxes[0];
    //     from = ranges[`${coord}1`];
    //     to = ranges[`${coord}2`];
    // }
    // auto-reverse as an added bonus
    if (from != null && to != null && from > to) {
        [from, to] = [to, from];
    }

    return { from: from, to: to, axis: axis };
}

function measureTickLabels(axis, surface) {
    const { options: opts } = axis;
    const ticks = axis.ticks || [];
    let labelWidth = opts.labelWidth || 0;
    let labelHeight = opts.labelHeight || 0;
    const maxWidth = labelWidth || (axis.direction === 'x' ? Math.floor(surface.width / (ticks.length || 1)) : null);
    const legacyStyles = `${axis.direction}Axis ${axis.direction}${axis.n}Axis`;
    const layer = `flot-${axis.direction}-axis flot-${axis.direction}${axis.n}-axis ${legacyStyles}`;
    const font = opts.font || 'flot-tick-label tickLabel';

    for (let i = 0; i < ticks.length; i += 1) {
        const t = ticks[i];

        if (!t.label) {
            continue;
        }

        const info = surface.getTextInfo(layer, t.label, font, null, maxWidth);
        labelWidth = Math.max(labelWidth, info.width);
        labelHeight = Math.max(labelHeight, info.height);
    }

    axis.labelWidth = opts.labelWidth || labelWidth;
    axis.labelHeight = opts.labelHeight || labelHeight;
}

function snapRangeToTicks(axis, ticks) {
    if (axis.options.autoscaleMargin && ticks.length > 0) {
        // snap to ticks
        if (axis.options.min == null) {
            axis.min = Math.min(axis.min, ticks[0].v);
        }
        if (axis.options.max == null && ticks.length > 1) {
            axis.max = Math.max(axis.max, ticks[ticks.length - 1].v);
        }
    }
}

function setTicks(axis) {
    const oticks = axis.options.ticks;
    let ticks = [];
    if (oticks == null || (typeof oticks === 'number' && oticks > 0)) {
        ticks = axis.tickGenerator(axis);
    } else if (oticks) {
        if (typeof oticks === 'function') {
            // generate the ticks
            ticks = oticks(axis);
        } else {
            ticks = oticks;
        }
    }

    // clean up/labelify the supplied ticks, copy them over
    let v;
    axis.ticks = [];
    for (let i = 0; i < ticks.length; i += 1) {
        let label = null;
        const t = ticks[i];
        if (typeof t === 'object') {
            v = +t[0];
            if (t.length > 1) {
                label = t[1]; // eslint-disable-line prefer-destructuring
            }
        } else {
            v = +t;
        }
        if (label == null) {
            label = axis.tickFormatter(v, axis);
        }
        if (!Number.isNaN(v)) {
            axis.ticks.push({ v: v, label: label });
        }
    }
}

// round to nearby lower multiple of base
function floorInBase(n, base) {
    return base * Math.floor(n / base);
}

/**
 * default tick generator
 * @param {*} axis
 */
function tickGenerator(axis) {
    const ticks = [];
    const start = floorInBase(axis.min, axis.tickSize);
    let i = 0;
    let v = Number.NaN;
    let prev;
    do {
        prev = v;
        v = start + i * axis.tickSize;
        ticks.push(v);
        i += 1;
    } while (v < axis.max && v !== prev);
    return ticks;
}

function tickGeneratorScaled(otherAxis, axis) {
    const ticks = [];
    for (let i = 0; i < otherAxis.ticks.length; i += 1) {
        let v = (otherAxis.ticks[i].v - otherAxis.min) / (otherAxis.max - otherAxis.min);
        v = axis.min + v * (axis.max - axis.min);
        ticks.push(v);
    }
    return ticks;
}

function tickFormatter(value, axis) {
    const factor = axis.tickDecimals ? Math.pow(10, axis.tickDecimals) : 1; // eslint-disable-line no-restricted-properties
    const formatted = `${Math.round(value * factor) / factor}`;

    // If tickDecimals was specified, ensure that we have exactly that
    // much precision; otherwise default to the value's own precision.
    if (axis.tickDecimals != null) {
        const decimal = formatted.indexOf('.');
        const precision = decimal === -1 ? 0 : formatted.length - decimal - 1;
        if (precision < axis.tickDecimals) {
            return (precision ? formatted : `${formatted}.`) + (factor.toString()).substr(1, axis.tickDecimals - precision);
        }
    }

    return formatted;
}

export {
    axisNumber,
    updateAxis,
    getBarLeftAlign,
    plotPoints,
    plotLine,
    plotLineArea,
    getColorOrGradient,
    getFillStyle,
    setRange,
    extractRange,
    measureTickLabels,
    snapRangeToTicks,
    setTicks,
    tickGenerator,
    tickGeneratorScaled,
    tickFormatter,
};
