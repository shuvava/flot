import { hasOwnProperty } from './flot-fn';
import { noop } from './flot-fn-vanilla';
import { getChildren, getStyle, setStyle, appendTo, detach, addClass, insertAfter, clone, extend, offset, removeData, empty, html } from './flot-fn-jquery';

import ColorHelper from './colorhelper';
import Canvas from './canvas';

import { options as defOptions, plotOffset as defPlotOffset, hooks as defHooks } from './plot-defaults';

// TODO: [VS] switch to vanilla implementation
noop();

const _plot_ = 'plot';

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


/**
 * The top-level container for the entire plot.
 */
export default class Plot {
    constructor(placeholder, data_, options_, plugins) {
        this.series = [];
        this.plotOffset = extend(true, {}, defPlotOffset);
        this.options = extend(true, {}, defOptions);

        this.surface = null; // the canvas for the plot itself
        this.overlay = null; // canvas for interactive stuff on top of plot
        this.eventHolder = null; // jQuery object that events should be bound to
        this.ctx = null;
        this.octx = null;
        this.xaxes = [];
        this.yaxes = [];
        this.plotWidth = 0;
        this.plotHeight = 0;
        this.hooks = extend(true, {}, defHooks);

        // interactive features
        this.highlights = [];
        this.redrawTimeout = null;

        // aliases:
        this.c2p = this.canvasToAxisCoords;
        this.p2c = this.axisToCanvasCoords;

        // initialize
        this.initPlugins(plugins);
        this.parseOptions(options_);
        this.setupCanvases();
        this.setData(data_);
        this.setupGrid();
        this.draw();
        this.bindEvents();
    }
    getPlaceholder() {
        return this.placeholder;
    }
    getCanvas() {
        return this.surface.element;
    }
    getPlotOffset() {
        return this.plotOffset;
    }
    getOptions() {
        return this.options;
    }
    getData() {
        return this.series;
    }
    getXAxes() {
        return this.xaxes;
    }
    getYAxes() {
        return this.yaxes;
    }
    getAxes() {
        const res = {};
        const arr = this.xaxes.concat(this.yaxes);
        for (let i = 0; i < arr.length; i += 1) {
            const axis = arr[i];
            if (axis) {
                const n = axis.n !== 1 ? axis.n : '';
                res[`${axis.direction}${n}axis`] = axis;
            }
        }
        return res;
    }
    /**
     * return flat array without annoying null entries
     */
    allAxes() {
        return this.xaxes
            .concat(this.yaxes)
            .filter(item => item != null);
    }
    width() {
        return this.plotWidth;
    }
    height() {
        return this.plotHeight;
    }
    offset() {
        const _offset = offset(this.eventHolder);
        _offset.left += this.plotOffset.left;
        _offset.top += this.plotOffset.top;
        return _offset;
    }
    pointOffset(point) {
        const left = this.xaxes[axisNumber(point, 'x') - 1].p2c(+point.x) + this.plotOffset.left;
        const top = this.yaxes[axisNumber(point, 'y') - 1].p2c(+point.y) + this.plotOffset.top;
        return {
            left: parseInt(left, 10),
            top: parseInt(top, 10),
        };
    }
    /**
     * extends array of data by default values
     * @param {Array.<Object>} data Graph data
     */
    parseData(data) {
        const res = [];
        for (let i = 0; i < data.length; i += 1) {
            let item = extend(true, {}, this.options.series);
            if (data[i].data != null) {
                // move the data instead of deep-copy
                item.data = data[i].data;
                delete data[i].data;

                item = extend(true, item, data[i]);

                data[i] = item.data;
            } else {
                item.data = data[i];
            }
            res.push(item);
        }

        return res;
    }
    /**
     * Update graph state
     * @param {Array.<Object>} data Graph data
     */
    setData(data) {
        this.parseData(data);
        this.fillInSeriesOptions();
        this.processData();
    }
    setupGrid() {
        const axes = this.allAxes();
        const { showGrid } = this.options.grid;

        // Initialize the plot's offset from the edge of the canvas
        for (const prop in this.plotOffset) {

        }
    }
    resize() {
        const width = this.placeholder.width();
        const height = this.placeholder.height();
        this.surface.resize(width, height);
        this.overlay.resize(width, height);
    }
    draw() {

    }
    canvasToAxisCoords(pos) {
        // return an object with x/y corresponding to all used axes
        const res = {};

        for (let i = 0; i < this.xaxes.length; i += 1) {
            const axis = this.xaxes[i];
            if (axis && axis.used) {
                res[`x${axis.n}`] = axis.c2p(pos.left);
            }
        }

        for (let i = 0; i < this.yaxes.length; i += 1) {
            const axis = this.yaxes[i];
            if (axis && axis.used) {
                res[`y${axis.n}`] = axis.c2p(pos.top);
            }
        }

        if (res.x1 !== undefined) { res.x = res.x1; }
        if (res.y1 !== undefined) { res.y = res.y1; }

        return res;
    }
    axisToCanvasCoords(pos) {
        // get canvas coords from the first pair of x/y found in pos
        const res = {};

        for (let i = 0; i < this.xaxes.length; i += 1) {
            const axis = this.xaxes[i];
            if (axis && axis.used) {
                let key = `x${axis.n}`;
                if (pos[key] == null && axis.n === 1) {
                    key = 'x';
                }

                if (pos[key] != null) {
                    res.left = axis.p2c(pos[key]);
                    break;
                }
            }
        }

        for (let i = 0; i < this.yaxes.length; i += 1) {
            const axis = this.yaxes[i];
            if (axis && axis.used) {
                let key = `y${axis.n}`;
                if (pos[key] == null && axis.n === 1) {
                    key = 'y';
                }

                if (pos[key] != null) {
                    res.top = axis.p2c(pos[key]);
                    break;
                }
            }
        }

        return res;
    }
    // TODO: [vs] make it static
    getOrCreateAxis(axes, number) {
        if (!axes[number - 1]) {
            axes[number - 1] = {
                n: number, // save the number for future reference
                direction: axes === this.xaxes ? 'x' : 'y',
                options: extend(true, {}, axes === this.xaxes ? this.options.xaxis : this.options.yaxis),
            };
        }
    }
    fillInSeriesOptions() {
        let neededColors = this.series.length;
        let maxIndex = -1;

        // Subtract the number of series that already have fixed colors or
        // color indexes from the number that we still need to generate.
        for (let i = 0; i < this.series.length; i += 1) {
            const sc = this.series[i].color;
            if (sc != null) {
                neededColors -= 1;
                if (typeof sc === 'number' && sc > maxIndex) {
                    maxIndex = sc;
                }
            }
        }

        // If any of the series have fixed color indexes, then we need to
        // generate at least as many colors as the highest index.
        if (neededColors <= maxIndex) {
            neededColors = maxIndex + 1;
        }

        // Generate all the colors, using first the option colors and then
        // variations on those colors once they're exhausted.

        const colors = [];
        const colorPool = this.options.colors;
        const colorPoolSize = colorPool.length;
        let variation = 0;

        for (let i = 0; i < neededColors; i += 1) {
            const c = new ColorHelper(colorPool[i % colorPoolSize] || '#666');

            // Each time we exhaust the colors in the pool we adjust
            // a scaling factor used to produce more variations on
            // those colors. The factor alternates negative/positive
            // to produce lighter/darker colors.

            // Reset the variation after every few cycles, or else
            // it will end up producing only white or black colors.

            if (i % colorPoolSize === 0 && i) {
                if (variation >= 0) {
                    if (variation < 0.5) {
                        variation = -variation - 0.2;
                    } else variation = 0;
                } else variation = -variation;
            }

            colors[i] = c.scale('rgb', 1 + variation);
        }

        // Finalize the series options, filling in their colors
        let colori = 0;

        for (let i = 0; i < this.series.length; i += 1) {
            const s = this.series[i];

            // assign colors
            if (s.color == null) {
                s.color = colors[colori].toString();
                colori += 1;
            } else if (typeof s.color === 'number') {
                s.color = colors[s.color].toString();
            }

            // turn on lines automatically in case nothing is set
            if (s.lines.show == null) {
                let show = true;
                for (const v in s) { // eslint-disable-line no-restricted-syntax
                    if (s[v] && s[v].show) {
                        show = false;
                        break;
                    }
                }
                if (show) {
                    s.lines.show = true;
                }
            }

            // If nothing was provided for lines.zero, default it to match
            // lines.fill, since areas by default should extend to zero.

            if (s.lines.zero == null) {
                s.lines.zero = !!s.lines.fill;
            }

            // setup axes
            s.xaxis = this.getOrCreateAxis(this.xaxes, axisNumber(s, 'x'));
            s.yaxis = this.getOrCreateAxis(this.yaxes, axisNumber(s, 'y'));
        }
    }
    processData() {
        // const topSentry = Number.POSITIVE_INFINITY;
        // const bottomSentry = Number.NEGATIVE_INFINITY;
        // const fakeInfinity = Number.MAX_VALUE;
        const allAxes = this.allAxes();
        for (let i = 0; i < allAxes.length; i += 1) {
            const axis = allAxes[i];
            axis.datamin = Number.POSITIVE_INFINITY;
            axis.datamax = Number.NEGATIVE_INFINITY;
            axis.used = false;
        }

        for (let i = 0; i < this.series.length; i += 1) {
            const s = this.series[i];
            s.datapoints = { points: [] };

            this.executeHooks(this.hooks.processRawData, [s, s.data, s.datapoints]);
        }
        // first pass: clean and copy data
        for (let i = 0; i < this.series.length; i += 1) {
            const s = this.series[i];

            const { data } = s;
            let { format } = s.datapoints;

            if (!format) {
                format = [];
                // find out how to copy
                format.push({ x: true, number: true, required: true });
                format.push({ y: true, number: true, required: true });

                if (s.bars.show || (s.lines.show && s.lines.fill)) {
                    const autoscale = !!((s.bars.show && s.bars.zero) || (s.lines.show && s.lines.zero));
                    format.push({
                        y: true,
                        number: true,
                        required: false,
                        defaultValue: 0,
                        autoscale: autoscale,
                    });
                    if (s.bars.horizontal) {
                        delete format[format.length - 1].y;
                        format[format.length - 1].x = true;
                    }
                }

                s.datapoints.format = format;
            }

            if (s.datapoints.pointsize != null) { // already filled in
                continue;
            }

            s.datapoints.pointsize = format.length;

            const _pointSize = s.datapoints.pointsize;
            const { points } = s.datapoints;

            const insertSteps = s.lines.show && s.lines.steps;
            s.xaxis.used = true;
            s.yaxis.used = true;

            // TODO: [vs] rewrite for
            let j = 0;
            let k = 0;
            for (j = k = 0; j < data.length; ++j, k += _pointSize) { // eslint-disable-line
                const point = data[j];

                let nullify = point == null;
                if (!nullify) {
                    for (let m = 0; m < _pointSize; m += 1) {
                        let val = point[m];
                        const _format = format[m];

                        if (_format) {
                            if (_format.number && val != null) {
                                val = +val; // convert to number
                                if (Number.isNaN(val)) {
                                    val = null;
                                } else if (val === Infinity) {
                                    val = Number.MAX_VALUE;
                                } else if (val === -Infinity) { val = -Number.MAX_VALUE; }
                            }

                            if (val == null) {
                                if (_format.required) {
                                    nullify = true;
                                }

                                if (_format.defaultValue != null) {
                                    val = _format.defaultValue;
                                }
                            }
                        }

                        points[k + m] = val;
                    }
                }

                if (nullify) {
                    for (let m = 0; m < _pointSize; m += 1) {
                        const val = points[k + m];
                        if (val != null) {
                            const _format = format[m];
                            // extract min/max info
                            if (_format.autoscale !== false) {
                                if (_format.x) {
                                    updateAxis(s.xaxis, val, val);
                                }
                                if (_format.y) {
                                    updateAxis(s.yaxis, val, val);
                                }
                            }
                        }
                        points[k + m] = null;
                    }
                } else
                // a little bit of line specific stuff that
                // perhaps shouldn't be here, but lacking
                // better means...
                if (insertSteps && k > 0
                            && points[k - _pointSize] != null
                            && points[k - _pointSize] !== points[k]
                            && points[k - _pointSize + 1] !== points[k + 1]) {
                    // copy the point to make room for a middle point
                    for (let m = 0; m < _pointSize; m += 1) {
                        points[k + _pointSize + m] = points[k + m];
                    }

                    // middle point has same y
                    points[k + 1] = points[k - _pointSize + 1];

                    // we've added a point, better reflect that
                    k += _pointSize;
                }
            }
        }

        // give the hooks a chance to run
        for (let i = 0; i < this.series.length; i += 1) {
            const _series = this.series[i];

            this.executeHooks(this.hooks.processDatapoints, [_series, _series.datapoints]);
        }

        // second pass: find datamax/datamin for auto-scaling
        for (let i = 0; i < this.series.length; i += 1) {
            const _series = this.series[i];
            const { points, format, pointsize: _pointSize } = _series.datapoints;

            let xmin = Number.POSITIVE_INFINITY;
            let ymin = Number.POSITIVE_INFINITY;
            let xmax = Number.NEGATIVE_INFINITY;
            let ymax = Number.NEGATIVE_INFINITY;

            for (let j = 0; j < points.length; j += _pointSize) {
                if (points[j] == null) { continue; }

                for (let m = 0; m < _pointSize; m += 1) {
                    const val = points[j + m];
                    const _format = format[m];
                    if (!_format || _format.autoscale === false
                       || val === Number.MAX_VALUE || val === -Number.MAX_VALUE) {
                        continue;
                    }

                    if (_format.x) {
                        if (val < xmin) { xmin = val; }
                        if (val > xmax) { xmax = val; }
                    }
                    if (_format.y) {
                        if (val < ymin) { ymin = val; }
                        if (val > ymax) { ymax = val; }
                    }
                }
            }

            if (_series.bars.show) {
                // make sure we got room for the bar on the dancing floor
                let delta;

                switch (_series.bars.align) {
                    case 'left':
                        delta = 0;
                        break;
                    case 'right':
                        delta = -_series.bars.barWidth;
                        break;
                    default:
                        delta = -_series.bars.barWidth / 2;
                }

                if (_series.bars.horizontal) {
                    ymin += delta;
                    ymax += delta + _series.bars.barWidth;
                } else {
                    xmin += delta;
                    xmax += delta + _series.bars.barWidth;
                }
            }

            updateAxis(_series.xaxis, xmin, xmax);
            updateAxis(_series.yaxis, ymin, ymax);
        }

        for (let i = 0; i < allAxes.length; i += 1) {
            const axis = allAxes[i];
            if (axis.datamin === Number.POSITIVE_INFINITY) {
                axis.datamin = null;
            }
            if (axis.datamax === Number.NEGATIVE_INFINITY) {
                axis.datamax = null;
            }
        }
    }
//#region draw
    highlight(s, point, auto) {
        if (typeof s === 'number') {
            s = this.series[s]; // eslint-disable-line prefer-destructuring
        }
        if (typeof point === 'number') {
            const ps = s.datapoints.pointsize;
            point = s.datapoints.points.slice(ps * point, ps * (point + 1));
        }
        const i = this.indexOfHighlight(s, point);
        if (i === -1) {
            this.highlights.push({ series: s, point: point, auto: auto });
            this.triggerRedrawOverlay();
        } else if (!auto) {
            this.highlights[i].auto = false;
        }
    }
    unhighlight(s, point) {
        if (s == null && point == null) {
            this.highlights = [];
            this.triggerRedrawOverlay();
            return;
        }

        if (typeof s === 'number') {
            s = this.series[s];
        }

        if (typeof point === 'number') {
            const ps = s.datapoints.pointsize;
            point = s.datapoints.points.slice(ps * point, ps * (point + 1));
        }

        const i = this.indexOfHighlight(s, point);
        if (i !== -1) {
            this.highlights.splice(i, 1);
            this.triggerRedrawOverlay();
        }
    }
    indexOfHighlight(s, point) {
        for (let i = 0; i < this.highlights.length; i += 1) {
            const h = this.highlights[i];
            if (h.series === s && h.point[0] === point[0] && h.point[1] === point[1]) {
                return i;
            }
        }
        return -1;
    }
    drawOverlay() {
        if (this.redrawTimeout) {
            window.clearTimeout(this.redrawTimeout);
            this.redrawTimeout = null;
        }
        // draw highlights
        this.octx.save();
        this.overlay.clear();
        this.octx.translate(this.plotOffset.left, this.plotOffset.top);
        for (let i = 0; i < this.highlights.length; i += 1) {
            const hi = this.highlights[i];
            if (hi.series.bars.show) {
                this.drawBarHighlight(hi.series, hi.point);
            } else {
                this.drawPointHighlight(hi.series, hi.point);
            }
        }
        this.octx.restore();
        this.executeHooks(this.hooks.drawOverlay, [this.octx]);
    }
    triggerRedrawOverlay() {
        const timeOut = this.options.interaction.redrawOverlayInterval;
        if (timeOut === -1) { // skip event queue
            this.drawOverlay();
            return;
        }
        if (!this.redrawTimeout) {
            this.redrawTimeout = window.setTimeout(this.drawOverlay, timeOut);
        }
    }
    /**
     * draw highlight contour
     * @param {*} series
     * @param {Array.<Number>} point chart point to highlight
     */
    drawPointHighlight(series, point) {
        let x = point[0];
        let y = point[1];
        const { xaxis: axisx, yaxis: axisy } = series;
        const highlightColor = (typeof series.highlightColor === 'string')
            ? series.highlightColor
            : (new ColorHelper(series.color)).scale('a', 0.5).toString();
        if (x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max) {
            return;
        }
        const pointRadius = series.points.radius + series.points.lineWidth / 2;
        const radius = 1.5 * pointRadius;
        this.octx.lineWidth = pointRadius;
        this.octx.strokeStyle = highlightColor;
        x = axisx.p2c(x);
        y = axisy.p2c(y);

        this.octx.beginPath();
        if (series.points.symbol === 'circle') {
            this.octx.arc(x, y, radius, 0, 2 * Math.PI, false);
        } else {
            series.points.symbol(this.octx, x, y, radius, false);
        }
        this.octx.closePath();
        this.octx.stroke();
    }
    drawBarHighlight(series, point) {
        const highlightColor = (typeof series.highlightColor === 'string')
            ? series.highlightColor
            : (new ColorHelper(series.color)).scale('a', 0.5).toString();
        const barLeft = getBarLeftAlign(series);
        this.octx.lineWidth = series.bars.lineWidth;
        this.strokeStyle = highlightColor;
        this.drawBar(
            point[0], point[1], point[2] || 0,
            barLeft, barLeft + series.bars.barWidth,
            () => highlightColor, series.xaxis, series.yaxis,
            this.octx, series.bars.horizontal, series.bars.lineWidth,
        );
    }
    getColorOrGradient(spec, bottom, top, defaultColor) {
        if (typeof spec === 'string') {
            return spec;
        }
        // assume this is a gradient spec; IE currently only
        // supports a simple vertical gradient properly, so that's
        // what we support too
        const gradient = this.ctx.createLinearGradient(0, top, 0, bottom);
        const len = spec.colors.length;
        for (let i = 0; i < len; i += 1) {
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
            gradient.addColorStop(i / (len - 1), c);
        }
        return gradient;
    }
    insertLegend() {
        if (this.options.legend.container != null) {
            html(this.options.legend.container, '');
        }
    }
//#endregion
    // #region interactive features
    onMouseMove(e) {
        if (this.options.grid.hoverable) {
            this.triggerClickHoverEvent(
                'plothover', e,
                s => s.hoverable !== false,
            );
        }
    }
    onMouseLeave(e) {
        this.triggerClickHoverEvent(
            'plothover', e,
            () => false,
        );
    }
    onClick(e) {
        this.triggerClickHoverEvent(
            'plotclick', e,
            s => s.clickable !== false,
        );
    }
    /**
     * returns the data item the mouse is over, or null if none is found
     * @param {Number} mouseX X canvas coordinate
     * @param {Number} mouseY Y canvas coordinate
     * @param {Function} seriesFilter
     */
    findNearbyItem(mouseX, mouseY, seriesFilter) {
        const maxDistance = this.options.grid.mouseActiveRadius;
        let smallestDistance = maxDistance * maxDistance + 1;
        let item;
        for (let i = this.series.length - 1; i >= 0; i -= 1) {
            if (!seriesFilter(this.series[i])) {
                continue;
            }
            const s = this.series[i];
            const { xaxis: axisx, yaxis: axisy } = s;
            const { points, pointsize: ps } = s.datapoints;
            // precompute some stuff to make the loop faster
            const mx = axisx.c2p(mouseX);
            const my = axisy.c2p(mouseY);
            let maxx = maxDistance / axisx.scale;
            let maxy = maxDistance / axisy.scale;
            // with inverse transforms, we can't use the maxx/maxy
            // optimization, sadly
            if (axisx.options.inverseTransform) {
                maxx = Number.MAX_VALUE;
            }
            if (axisy.options.inverseTransform) {
                maxy = Number.MAX_VALUE;
            }

            if (s.lines.show || s.points.show) {
                for (let j = 0; j < points.length; j += ps) {
                    const x = points[j];
                    const y = points[j + 1];
                    if (x == null) {
                        continue;
                    }
                    // For points and lines, the cursor must be within a
                    // certain distance to the data point
                    if (x - mx > maxx || x - mx < -maxx ||
                       y - my > maxy || y - my < -maxy) {
                        continue;
                    }

                    // We have to calculate distances in pixels, not in
                    // data units, because the scales of the axes may be different
                    const dx = Math.abs(axisx.p2c(x) - mouseX);
                    const dy = Math.abs(axisy.p2c(y) - mouseY);
                    const dist = dx * dx + dy * dy; // we save the sqrt

                    // use <= to ensure last point takes precedence
                    // (last generally means on top of)
                    if (dist < smallestDistance) {
                        smallestDistance = dist;
                        item = [i, j / ps];
                    }
                }
            }
            if (s.bars.show && !item) { // no other point can be nearby
                const barLeft = getBarLeftAlign(s);
                const barRight = barLeft + s.bars.barWidth;
                for (let j = 0; j < points.length; j += ps) {
                    const x = points[j];
                    const y = points[j + 1];
                    const b = points[j + 2];
                    if (x == null) {
                        continue;
                    }

                    // for a bar graph, the cursor must be inside the bar
                    if (this.series[i].bars.horizontal
                        ? (mx <= Math.max(b, x)
                           && mx >= Math.min(b, x)
                           && my >= y + barLeft
                           && my <= y + barRight)
                        : (mx >= x + barLeft
                           && mx <= x + barRight
                           && my >= Math.min(b, y)
                           && my <= Math.max(b, y))
                    ) {
                        item = [i, j / ps];
                    }
                }
            }
        }
        if (item) {
            const i = item[0];
            const j = item[1];
            const { pointsize: ps } = this.series[i].datapoints;
            return {
                datapoint: this.series[i].datapoints.points.slice(j * ps, (j + 1) * ps),
                dataIndex: j,
                series: this.series[i],
                seriesIndex: i,
            };
        }
        return null;
    }
    /**
     * trigger click or hover event (they send the same parameters so we share their code)
     * @param {String} eventname Name of event {click|hover}
     * @param {*} event native event
     * @param {Function} seriesFilter
     */
    triggerClickHoverEvent(eventname, event, seriesFilter) {
        const _offset = this.eventHolder.offset();
        const canvasX = event.pageX - _offset.left - this.plotOffset.left;
        const canvasY = event.pageY - _offset.top - this.plotOffset.top;
        const pos = this.canvasToAxisCoords({ left: canvasX, top: canvasY });

        pos.pageX = event.pageX;
        pos.pageY = event.pageY;
        const item = this.findNearbyItem(canvasX, canvasY, seriesFilter);
        if (item) {
            // fill in mouse pos for any listeners out there
            item.pageX = parseInt(item.series.xaxis.p2c(item.datapoint[0]) + _offset.left + this.plotOffset.left, 10);
            item.pageY = parseInt(item.series.yaxis.p2c(item.datapoint[1]) + _offset.top + this.plotOffset.top, 10);
        }

        if (this.options.grid.autoHighlight) {
            // clear auto-highlights
            for (let i = 0; i < this.highlights.length; i += 1) {
                const h = this.highlights[i];
                if (h.auto === eventname &&
                   !(item && h.series === item.series &&
                   h.point[0] === item.datapoint[0] &&
                   h.point[1] === item.datapoint[1])) {
                    this.unhighlight(h.series, h.point);
                }
            }

            if (item) {
                this.highlight(item.series, item.datapoint, eventname);
            }
        }

        this.placeholder.trigger(eventname, [pos, item]);
    }
    // #endregion
    executeHooks(hook, args) {
        const _args = [this].concat(args);
        for (let i = 0; i < hook.length; i += 1) {
            hook[i].apply(this, _args);
        }
    }
    initPlugins(plugins) {
        // References to key classes, allowing plugins to modify them
        const classes = {
            Canvas: Canvas,
        };
        for (let i = 0; i < plugins.length; i += 1) {
            const plugin = plugins[i];
            plugin.init(this, classes);
            if (plugin.options) {
                this.options = extend(true, this.options, plugin.options);
            }
        }
    }
    parseOptions(opts) {
        this.options = extend(true, this.options, opts);

        // $.extend merges arrays, rather than replacing them.  When less
        // colors are provided than the size of the default palette, we
        // end up with those colors plus the remaining defaults, which is
        // not expected behavior; avoid it by replacing them here.
        if (opts && opts.colors) {
            this.options.colors = opts.colors;
        }
        if (this.options.xaxis.color == null) {
            this.options.xaxis.color = (new ColorHelper(this.options.grid.color)).scale('a', 0.22).toString();
        }
        if (this.options.yaxis.color == null) {
            this.options.yaxis.color = (new ColorHelper(this.options.grid.color)).scale('a', 0.22).toString();
        }
        if (this.options.xaxis.tickColor == null) { // grid.tickColor for back-compatibility
            this.options.xaxis.tickColor = this.options.grid.tickColor || this.options.xaxis.color;
        }
        if (this.options.yaxis.tickColor == null) { // grid.tickColor for back-compatibility
            this.options.yaxis.tickColor = this.options.grid.tickColor || this.options.yaxis.color;
        }
        if (this.options.grid.borderColor == null) {
            this.options.grid.borderColor = this.options.grid.color;
        }
        if (this.options.grid.tickColor == null) {
            this.options.grid.tickColor = (new ColorHelper(this.options.grid.color)).scale('a', 0.22).toString();
        }

        // Fill in defaults for axis options, including any unspecified
        // font-spec fields, if a font-spec was provided.

        // If no x/y axis options were provided, create one of each anyway,
        // since the rest of the code assumes that they exist.
        const fontSize = getStyle(this.placeholder, 'font-size');
        const fontSizeDefault = fontSize ? +fontSize.replace('px', '') : 13;
        const fontDefaults = {
            style: getStyle(this.placeholder, 'font-style'),
            size: Math.round(0.8 * fontSizeDefault),
            variant: getStyle(this.placeholder, 'font-variant'),
            weight: getStyle(this.placeholder, 'font-weight'),
            family: getStyle(this.placeholder, 'font-family'),
        };
        let axisCount = this.options.xaxes.length || 1;
        for (let i = 0; i < axisCount; i += 1) {
            let axisOptions = this.options.xaxes[i];
            if (axisOptions && !axisOptions.tickColor) {
                axisOptions.tickColor = axisOptions.color;
            }

            axisOptions = extend(true, {}, this.options.xaxes, axisOptions);
            this.options.xaxes[i] = axisOptions;

            if (axisOptions.font) {
                axisOptions.font = extend({}, fontDefaults, axisOptions.font);
                if (!axisOptions.font.color) {
                    axisOptions.font.color = axisOptions.color;
                }
                if (!axisOptions.font.lineHeight) {
                    axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                }
            }
        }

        axisCount = this.options.yaxes.length || 1;
        for (let i = 0; i < axisCount; i += 1) {
            let axisOptions = this.options.yaxes[i];
            if (axisOptions && !axisOptions.tickColor) {
                axisOptions.tickColor = axisOptions.color;
            }

            axisOptions = extend(true, {}, this.options.yaxis, axisOptions);
            this.options.yaxes[i] = axisOptions;

            if (axisOptions.font) {
                axisOptions.font = extend({}, fontDefaults, axisOptions.font);
                if (!axisOptions.font.color) {
                    axisOptions.font.color = axisOptions.color;
                }
                if (!axisOptions.font.lineHeight) {
                    axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                }
            }
        }

        // backwards compatibility, to be removed in future
        if (this.options.xaxis.noTicks && this.options.xaxis.ticks == null) {
            this.options.xaxis.ticks = this.options.xaxis.noTicks;
        }
        if (this.options.yaxis.noTicks && this.options.yaxis.ticks == null) {
            this.options.yaxis.ticks = this.options.yaxis.noTicks;
        }
        if (this.options.x2axis) {
            this.options.xaxes[1] = extend(true, {}, this.options.xaxis, this.options.x2axis);
            this.options.xaxes[1].position = 'top';
            // Override the inherit to allow the axis to auto-scale
            if (this.options.x2axis.min == null) {
                this.options.xaxes[1].min = null;
            }
            if (this.options.x2axis.max == null) {
                this.options.xaxes[1].max = null;
            }
        }
        if (this.options.y2axis) {
            this.options.yaxes[1] = extend(true, {}, this.options.yaxis, this.options.y2axis);
            this.options.yaxes[1].position = 'right';
            // Override the inherit to allow the axis to auto-scale
            if (this.options.y2axis.min == null) {
                this.options.yaxes[1].min = null;
            }
            if (this.options.y2axis.max == null) {
                this.options.yaxes[1].max = null;
            }
        }
        if (this.options.grid.coloredAreas) {
            this.options.grid.markings = this.options.grid.coloredAreas;
        }
        if (this.options.grid.coloredAreasColor) {
            this.options.grid.markingsColor = this.options.grid.coloredAreasColor;
        }
        if (this.options.lines) {
            this.options.series.lines = extend(true, this.options.series.lines, this.options.lines);
        }
        if (this.options.points) {
            this.options.series.points = extend(true, this.options.series.points, this.options.points);
        }
        if (this.options.bars) {
            this.options.series.bars = extend(true, this.options.series.bars, this.options.bars);
        }
        if (this.options.shadowSize != null) {
            this.options.series.shadowSize = this.options.shadowSize;
        }
        if (this.options.highlightColor != null) {
            this.options.series.highlightColor = this.options.highlightColor;
        }

        // save options on axes for future reference
        for (let i = 0; i < this.options.xaxes.length; i += 1) {
            this.getOrCreateAxis(this.xaxes, i + 1).options = this.options.xaxes[i];
        }
        for (let i = 0; i < this.options.yaxes.length; i += 1) {
            this.getOrCreateAxis(this.yaxes, i + 1).options = this.options.yaxes[i];
        }

        // add hooks from options
        for (const hookName in this.hooks) { // eslint-disable-line no-restricted-syntax
            if (hasOwnProperty.call(this.hooks, hookName)) {
                if (this.options.hooks[hookName] && this.options.hooks[hookName].length) {
                    this.hooks[hookName] = this.hooks[hookName].concat(this.options.hooks[hookName]);
                }
            }
        }

        this.executeHooks(this.hooks.processOptions, [this.options]);
    }
    shutdown() {}
    destroy() {
        this.shutdown();
        removeData(this.placeholder, _plot_);
        empty(this.placeholder);
        this.series = [];
        this.options = null;
        this.surface = null;
        this.overlay = null;
        this.ctx = null;
        this.octx = null;
        this.xaxes = [];
        this.yaxes = [];
        this.highlight = [];
        this.hooks = null;
    }
}
