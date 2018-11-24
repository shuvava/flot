import { hasOwnProperty } from './flot-fn';
import { noop } from './flot-fn-vanilla';
import {
    getChildren, getStyle, setStyle,
    hasClass,
    appendTo, prependTo,
    extend, offset,
    domData, removeData, empty,
    html, remove, extractColor,
    getWidth, getHeight,
} from './flot-fn-jquery';

import {
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
} from './plot-fn';

import ColorHelper from './colorhelper';
import Canvas from './canvas';

import { options as defOptions, plotOffset as defPlotOffset, hooks as defHooks } from './plot-defaults';

// TODO: [VS] switch to vanilla implementation
noop();

const _plot_ = 'plot';

/**
 * The top-level container for the entire plot.
 */
export default class Plot {
    constructor(placeholder, data_, options_, plugins) {
        this.placeholder = placeholder;
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
        this.drawOverlayFn = this.drawOverlay.bind(this);

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
     * @param {Array.<Object>} _data Graph data
     */
    parseData(_data) {
        const res = [];
        for (let i = 0; i < _data.length; i += 1) {
            let item = extend(true, {}, this.options.series);
            if (_data[i].data != null) {
                // move the data instead of deep-copy
                item.data = _data[i].data;
                delete _data[i].data;

                item = extend(true, item, _data[i]);

                _data[i] = item.data;
            } else {
                item.data = _data[i];
            }
            res.push(item);
        }

        return res;
    }

    /**
     * Update graph state
     * @param {Array.<Object>} _data Graph data
     */
    setData(_data) {
        this.series = this.parseData(_data);
        this.fillInSeriesOptions();
        this.processData();
    }

    allocateAxisBoxFirstPhase(axis) {
        // find the bounding box of the axis by looking at label
        // widths/heights and ticks, make room by diminishing the
        // plotOffset; this first phase only looks at one
        // dimension per axis, the other dimension depends on the
        // other axes so will have to wait
        let { labelWidth: lw, labelHeight: lh } = axis;
        const pos = axis.options.position;
        const isXAxis = axis.direction === 'x';
        let tickLength = axis.options.tickLength; // eslint-disable-line prefer-destructuring
        let axisMargin = this.options.grid.axisMargin;// eslint-disable-line prefer-destructuring
        let padding = this.options.grid.labelMargin;
        let innermost = true;
        let outermost = true;
        let first = true;
        let found = false;

        // Determine the axis's position in its direction and on its side
        const _axis = isXAxis ? this.xaxes : this.yaxes;
        for (let i = 0; i < _axis.length; i += 1) {
            const a = _axis[i];
            if (a && (a.show || a.reserveSpace)) {
                if (a === axis) {
                    found = true;
                } else if (a.options.position === pos) {
                    if (found) {
                        outermost = false;
                    } else {
                        innermost = false;
                    }
                }
                if (!found) {
                    first = false;
                }
            }
        }

        // The outermost axis on each side has no margin
        if (outermost) {
            axisMargin = 0;
        }

        // The ticks for the first axis in each direction stretch across
        if (tickLength == null) {
            tickLength = first ? 'full' : 5;
        }

        if (!Number.isNaN(+tickLength)) {
            padding += +tickLength;
        }

        if (isXAxis) {
            lh += padding;

            if (pos === 'bottom') {
                this.plotOffset.bottom += lh + axisMargin;
                axis.box = { top: this.surface.height - this.plotOffset.bottom, height: lh };
            } else {
                axis.box = { top: this.plotOffset.top + axisMargin, height: lh };
                this.plotOffset.top += lh + axisMargin;
            }
        } else {
            lw += padding;

            if (pos === 'left') {
                axis.box = { left: this.plotOffset.left + axisMargin, width: lw };
                this.plotOffset.left += lw + axisMargin;
            } else {
                this.plotOffset.right += lw + axisMargin;
                axis.box = { left: this.surface.width - this.plotOffset.right, width: lw };
            }
        }

        // save for future reference
        axis.position = pos;
        axis.tickLength = tickLength;
        axis.box.padding = padding;
        axis.innermost = innermost;
    }

    allocateAxisBoxSecondPhase(axis) {
        // now that all axis boxes have been placed in one
        // dimension, we can set the remaining dimension coordinates
        if (axis.direction === 'x') {
            axis.box.left = this.plotOffset.left - axis.labelWidth / 2;
            axis.box.width = this.surface.width - this.plotOffset.left - this.plotOffset.right + axis.labelWidth;
        } else {
            axis.box.top = this.plotOffset.top - axis.labelHeight / 2;
            axis.box.height = this.surface.height - this.plotOffset.bottom - this.plotOffset.top + axis.labelHeight;
        }
    }

    adjustLayoutForThingsStickingOut() {
        // possibly adjust plot offset to ensure everything stays
        // inside the canvas and isn't clipped off
        let minMargin = this.options.grid.minBorderMargin;

        // check stuff from the plot (FIXME: this should just read
        // a value from the series, otherwise it's impossible to
        // customize)
        if (minMargin == null) {
            minMargin = 0;

            for (let i = 0; i < this.series.length; i += 1) {
                minMargin = Math.max(minMargin, 2 * (this.series[i].points.radius + this.series[i].points.lineWidth / 2));
            }
        }

        const margins = {
            left: minMargin,
            right: minMargin,
            top: minMargin,
            bottom: minMargin,
        };
        // check axis labels, note we don't check the actual
        // labels but instead use the overall width/height to not
        // jump as much around with replots
        const allAxes = this.allAxes();
        for (let i = 0; i < allAxes.length; i += 1) {
            const axis = allAxes[i];
            if (axis.reserveSpace && axis.ticks && axis.ticks.length) {
                if (axis.direction === 'x') {
                    margins.left = Math.max(margins.left, axis.labelWidth / 2);
                    margins.right = Math.max(margins.right, axis.labelWidth / 2);
                } else {
                    margins.bottom = Math.max(margins.bottom, axis.labelHeight / 2);
                    margins.top = Math.max(margins.top, axis.labelHeight / 2);
                }
            }
        }

        this.plotOffset.left = Math.ceil(Math.max(margins.left, this.plotOffset.left));
        this.plotOffset.right = Math.ceil(Math.max(margins.right, this.plotOffset.right));
        this.plotOffset.top = Math.ceil(Math.max(margins.top, this.plotOffset.top));
        this.plotOffset.bottom = Math.ceil(Math.max(margins.bottom, this.plotOffset.bottom));
    }

    setTransformationHelpers(axis) {
        // set helper functions on the axis, assumes plot area
        // has been computed already
        const identity = x => x;
        const t = axis.options.transform || identity;
        const it = axis.options.inverseTransform;
        let s;
        let m;

        // precompute how much the axis is scaling a point
        // in canvas space
        if (axis.direction === 'x') {
            axis.scale = this.plotWidth / Math.abs(t(axis.max) - t(axis.min));
            s = axis.scale;
            m = Math.min(t(axis.max), t(axis.min));
        } else {
            axis.scale = this.plotHeight / Math.abs(t(axis.max) - t(axis.min));
            s = axis.scale;
            s = -s;
            m = Math.max(t(axis.max), t(axis.min));
        }

        // data point to canvas coordinate
        if (t === identity) { // slight optimization
            axis.p2c = p => (p - m) * s;
        } else {
            axis.p2c = p => (t(p) - m) * s;
        }

        // canvas coordinate to data point
        if (!it) {
            axis.c2p = c => m + c / s;
        } else {
            axis.c2p = c => it(m + c / s);
        }
    }

    setupCanvases() {
        // Make sure the placeholder is clear of everything except canvases
        // from a previous plot in this container that we'll try to re-use.
        setStyle(this.placeholder, { padding: 0 });// padding messes up the positioning
        const elm = getChildren(this.placeholder);
        for (let i = elm.length - 1; i >= 0; i -= 1) {
            if (!hasClass(elm[i], 'flot-overlay') && !hasClass(elm[i], 'flot-base')) {
                elm[i].remove();
            }
        }

        if (getStyle(this.placeholder, 'position') === 'static') { // for positioning labels and overlay
            setStyle(this.placeholder, { position: 'relative' });
        }

        this.surface = new Canvas('flot-base', this.placeholder);
        this.overlay = new Canvas('flot-overlay', this.placeholder); // overlay canvas for interactive features
        this.eventHolder = this.overlay.element;

        this.ctx = this.surface.context;
        this.octx = this.overlay.context;

        // define which element we're listening for events on
        this.unbindEvents();

        // If we're re-using a plot object, shut down the old one
        const existing = domData(this.placeholder, 'plot');
        if (existing) {
            existing.shutdown();
            this.overlay.clear();
        }

        domData(this.placeholder, 'plot', this);
    }

    setupGrid() {
        const axes = this.allAxes();
        const { show: showGrid } = this.options.grid;

        // Initialize the plot's offset from the edge of the canvas
        for (const prop in this.plotOffset) { // eslint-disable-line
            const margin = this.options.grid.margin || 0;
            this.plotOffset[prop] = typeof margin === 'number' ? margin : margin[prop] || 0;
        }

        this.executeHooks(this.hooks.processOffset, [this.plotOffset]);

        // If the grid is visible, add its border width to the offset
        for (const prop in this.plotOffset) { // eslint-disable-line
            if (typeof (this.options.grid.borderWidth) === 'object') {
                this.plotOffset[prop] += showGrid ? this.options.grid.borderWidth[prop] : 0;
            } else {
                this.plotOffset[prop] += showGrid ? this.options.grid.borderWidth : 0;
            }
        }

        for (let i = 0; i < axes.length; i += 1) {
            const axis = axes[i];
            const { options: axisOpts } = axis;
            axis.show = axisOpts.show == null ? axis.used : axisOpts.show;
            axis.reserveSpace = axisOpts.reserveSpace == null ? axis.show : axisOpts.reserveSpace;
            setRange(axis);
        }

        if (showGrid) {
            const allocatedAxes = axes
                .filter(axis => axis.show || axis.reserveSpace);
            for (let i = 0; i < allocatedAxes.length; i += 1) {
                const axis = allocatedAxes[i];
                // make the ticks
                this.setupTickGeneration(axis);
                setTicks(axis);
                snapRangeToTicks(axis, axis.ticks);
                // find labelWidth/Height for axis
                measureTickLabels(axis, this.surface);
            }

            // with all dimensions calculated, we can compute the
            // axis bounding boxes, start from the outside
            // (reverse order)
            for (let i = allocatedAxes.length - 1; i >= 0; i -= 1) {
                this.allocateAxisBoxFirstPhase(allocatedAxes[i]);
            }

            // make sure we've got enough space for things that
            // might stick out
            this.adjustLayoutForThingsStickingOut();
            for (let i = 0; i < allocatedAxes.length; i += 1) {
                this.allocateAxisBoxSecondPhase(allocatedAxes[i]);
            }
        }

        this.plotWidth = this.surface.width - this.plotOffset.left - this.plotOffset.right;
        this.plotHeight = this.surface.height - this.plotOffset.bottom - this.plotOffset.top;

        // now we got the proper plot dimensions, we can compute the scaling
        for (let i = 0; i < axes.length; i += 1) {
            this.setTransformationHelpers(axes[i]);
        }

        if (showGrid) {
            this.drawAxisLabels();
        }

        this.insertLegend();
    }

    setupTickGeneration(axis) {
        const { options: opts } = axis;
        // estimate number of ticks
        let noTicks;
        if (typeof opts.ticks === 'number' && opts.ticks > 0) {
            noTicks = opts.ticks;
        } else {
            // heuristic based on the model a*sqrt(x) fitted to
            // some data points that seemed reasonable
            noTicks = 0.3 * Math.sqrt(axis.direction === 'x' ? this.surface.width : this.surface.height);
        }
        const delta = (axis.max - axis.min) / noTicks;
        const maxDec = opts.tickDecimals;
        let dec = -Math.floor(Math.log(delta) / Math.LN10);

        if (maxDec != null && dec > maxDec) {
            dec = maxDec;
        }

        const magn = Math.pow(10, -dec); // eslint-disable-line no-restricted-properties
        const norm = delta / magn; // norm is between 1.0 and 10.0
        let size;

        if (norm < 1.5) {
            size = 1;
        } else if (norm < 3) {
            size = 2;
            // special case for 2.5, requires an extra decimal
            if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
                size = 2.5;
                dec += 1;
            }
        } else if (norm < 7.5) {
            size = 5;
        } else {
            size = 10;
        }

        size *= magn;

        if (opts.minTickSize != null && size < opts.minTickSize) {
            size = opts.minTickSize;
        }

        axis.delta = delta;
        axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
        axis.tickSize = opts.tickSize || size;

        // Time mode was moved to a plug-in in 0.8, and since so many people use it
        // we'll add an especially friendly reminder to make sure they included it.
        if (opts.mode === 'time' && !axis.tickGenerator) {
            throw new Error('Time mode requires the flot.time plugin.');
        }

        // Flot supports base-10 axes; any other mode else is handled by a plug-in,
        // like flot.time.js.
        if (!axis.tickGenerator) {
            axis.tickGenerator = tickGenerator;
            axis.tickFormatter = tickFormatter;
        }

        if (typeof opts.tickFormatter === 'function') {
            axis.tickFormatter = (v, _axis) => opts.tickFormatter(v, _axis).toString();
        }

        if (opts.alignTicksWithAxis != null) {
            const otherAxis = (axis.direction === 'x' ? this.xaxes : this.yaxes)[opts.alignTicksWithAxis - 1];
            if (otherAxis && otherAxis.used && otherAxis !== axis) {
                // consider snapping min/max to outermost nice ticks
                const niceTicks = axis.tickGenerator(axis);
                if (niceTicks.length > 0) {
                    if (opts.min == null) {
                        axis.min = Math.min(axis.min, niceTicks[0]);
                    }
                    if (opts.max == null && niceTicks.length > 1) {
                        axis.max = Math.max(axis.max, niceTicks[niceTicks.length - 1]);
                    }
                }

                axis.tickGenerator = tickGeneratorScaled.bind(null, otherAxis);

                // we might need an extra decimal since forced
                // ticks don't necessarily fit naturally
                if (!axis.mode && opts.tickDecimals == null) {
                    const extraDec = Math.max(0, -Math.floor(Math.log(axis.delta) / Math.LN10) + 1);
                    const ts = axis.tickGenerator(axis);

                    // only proceed if the tick interval rounded
                    // with an extra decimal doesn't give us a
                    // zero at end
                    if (!(ts.length > 1 && /\..*0$/.test((ts[1] - ts[0]).toFixed(extraDec)))) {
                        axis.tickDecimals = extraDec;
                    }
                }
            }
        }
    }

    resize() {
        const width = this.placeholder.width();
        const height = this.placeholder.height();
        this.surface.resize(width, height);
        this.overlay.resize(width, height);
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
        return axes[number - 1];
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

    // #region draw
    draw() {
        this.surface.clear();
        this.executeHooks(this.hooks.drawBackground, [this.ctx]);

        const { grid } = this.options;
        // draw background, if any
        if (grid.show && grid.backgroundColor) {
            this.drawBackground();
        }

        if (grid.show && !grid.aboveData) {
            this.drawGrid();
        }

        for (let i = 0; i < this.series.length; i += 1) {
            this.executeHooks(this.hooks.drawSeries, [this.ctx, this.series[i]]);
            this.drawSeries(this.series[i]);
        }

        this.executeHooks(this.hooks.draw, [this.ctx]);

        if (grid.show && grid.aboveData) {
            this.drawGrid();
        }

        this.surface.render();

        // A draw implies that either the axes or data have changed, so we
        // should probably update the overlay highlights as well.

        this.triggerRedrawOverlay();
    }

    drawSeries(series) {
        if (series.lines.show) {
            this.drawSeriesLines(series);
        }
        if (series.bars.show) {
            this.drawSeriesBars(series);
        }
        if (series.points.show) {
            this.drawSeriesPoints(series);
        }
    }

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
            s = this.series[s]; // eslint-disable-line prefer-destructuring
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
            this.redrawTimeout = window.setTimeout(this.drawOverlayFn, timeOut);
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
            series.bars.horizontal, series.bars.lineWidth,
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

    drawSeriesPoints(series) {
        this.ctx.save();
        this.ctx.translate(this.plotOffset.left, this.plotOffset.top);

        let { lineWidth: lw } = series.points;
        const { radius, symbol } = series.points;
        const sw = series.shadowSize;

        // If the user sets the line width to 0, we change it to a very
        // small value. A line width of 0 seems to force the default of 1.
        // Doing the conditional here allows the shadow setting to still be
        // optional even with a lineWidth of 0.
        if (lw === 0) {
            lw = 0.0001;
        }
        if (lw > 0 && sw > 0) {
            // draw shadow in two steps
            const w = sw / 2;
            this.ctx.lineWidth = w;
            this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            plotPoints(
                series.datapoints, radius, null, w + w / 2, true,
                series.xaxis, series.yaxis, symbol, this.ctx,
            );

            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            plotPoints(
                series.datapoints, radius, null, w / 2, true,
                series.xaxis, series.yaxis, symbol, this.ctx,
            );
        }

        this.ctx.lineWidth = lw;
        this.ctx.strokeStyle = series.color;
        plotPoints(
            series.datapoints, radius,
            getFillStyle(series.points, series.color, this.ctx), 0, false,
            series.xaxis, series.yaxis, symbol, this.ctx,
        );
        this.ctx.restore();
    }

    drawSeriesLines(series) {
        this.ctx.save();
        this.ctx.translate(this.plotOffset.left, this.plotOffset.top);
        this.ctx.lineJoin = 'round';

        const lw = series.lines.lineWidth;
        const sw = series.shadowSize;
        // FIXME: consider another form of shadow when filling is turned on
        if (lw > 0 && sw > 0) {
            // draw shadow as a thick and thin line with transparency
            this.ctx.lineWidth = sw;
            this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            // position shadow at angle from the mid of line
            const angle = Math.PI / 18;
            plotLine(
                series.datapoints,
                Math.sin(angle) * (lw / 2 + sw / 2),
                Math.cos(angle) * (lw / 2 + sw / 2),
                series.xaxis,
                series.yaxis,
                this.ctx,
            );
            this.ctx.lineWidth = sw / 2;
            plotLine(
                series.datapoints,
                Math.sin(angle) * (lw / 2 + sw / 4),
                Math.cos(angle) * (lw / 2 + sw / 4),
                series.xaxis,
                series.yaxis,
                this.ctx,
            );
        }

        this.ctx.lineWidth = lw;
        this.ctx.strokeStyle = series.color;
        const fillStyle = getFillStyle(series.lines, series.color, 0, this.plotHeight);
        if (fillStyle) {
            this.ctx.fillStyle = fillStyle;
            plotLineArea(
                series.datapoints,
                series.xaxis,
                series.yaxis,
                this.ctx,
            );
        }

        if (lw > 0) {
            plotLine(
                series.datapoints,
                0,
                0,
                series.xaxis,
                series.yaxis,
                this.ctx,
            );
        }
        this.ctx.restore();
    }

    drawSeriesBars(series) {
        this.ctx.save();
        this.ctx.translate(this.plotOffset.left, this.plotOffset.top);

        // FIXME: figure out a way to add shadows (for instance along the right edge)
        this.ctx.lineWidth = series.bars.lineWidth;
        this.ctx.strokeStyle = series.color;

        let barLeft;

        switch (series.bars.align) {
            case 'left':
                barLeft = 0;
                break;
            case 'right':
                barLeft = -series.bars.barWidth;
                break;
            default:
                barLeft = -series.bars.barWidth / 2;
        }

        const fillStyleCallback = series.bars.fill ? (bottom, top) => getFillStyle(series.bars, series.color, bottom, top) : null;
        // plotBars(series.datapoints, barLeft, barLeft + series.bars.barWidth, fillStyleCallback, series.xaxis, series.yaxis);
        const { points } = series.datapoints;
        const ps = series.datapoints.pointsize;

        for (let i = 0; i < points.length; i += ps) {
            if (points[i] == null) {
                continue;
            }
            this.drawBar(
                points[i],
                points[i + 1],
                points[i + 2],
                barLeft,
                barLeft + series.bars.barWidth,
                fillStyleCallback,
                series.xaxis,
                series.yaxis,
                series.bars.horizontal,
                series.bars.lineWidth,
            );
        }
        this.ctx.restore();
    }

    drawBar(x, y, b, barLeft, barRight, fillStyleCallback, axisx, axisy, horizontal, lineWidth) {
        let left;
        let right;
        let bottom;
        let top;
        let drawLeft;
        let drawRight;
        let drawTop;
        let drawBottom;
        let tmp;

        // in horizontal mode, we start the bar from the left
        // instead of from the bottom so it appears to be
        // horizontal rather than vertical
        if (horizontal) {
            drawBottom = true;
            drawRight = true;
            drawTop = true;
            drawLeft = false;
            left = b;
            right = x;
            top = y + barLeft;
            bottom = y + barRight;

            // account for negative bars
            if (right < left) {
                tmp = right;
                right = left;
                left = tmp;
                drawLeft = true;
                drawRight = false;
            }
        } else {
            drawLeft = true;
            drawRight = true;
            drawTop = true;
            drawBottom = false;
            left = x + barLeft;
            right = x + barRight;
            bottom = b;
            top = y;

            // account for negative bars
            if (top < bottom) {
                tmp = top;
                top = bottom;
                bottom = tmp;
                drawBottom = true;
                drawTop = false;
            }
        }

        // clip
        if (right < axisx.min || left > axisx.max
            || top < axisy.min || bottom > axisy.max) { return; }

        if (left < axisx.min) {
            left = axisx.min;
            drawLeft = false;
        }

        if (right > axisx.max) {
            right = axisx.max;
            drawRight = false;
        }

        if (bottom < axisy.min) {
            bottom = axisy.min;
            drawBottom = false;
        }

        if (top > axisy.max) {
            top = axisy.max;
            drawTop = false;
        }

        left = axisx.p2c(left);
        bottom = axisy.p2c(bottom);
        right = axisx.p2c(right);
        top = axisy.p2c(top);

        // fill the bar
        if (fillStyleCallback) {
            this.ctx.fillStyle = fillStyleCallback(bottom, top);
            this.ctx.fillRect(left, top, right - left, bottom - top);
        }

        // draw outline
        if (lineWidth > 0 && (drawLeft || drawRight || drawTop || drawBottom)) {
            this.ctx.beginPath();

            // FIXME: inline moveTo is buggy with excanvas
            this.ctx.moveTo(left, bottom);
            if (drawLeft) { this.ctx.lineTo(left, top); } else { this.ctx.moveTo(left, top); }
            if (drawTop) { this.ctx.lineTo(right, top); } else { this.ctx.moveTo(right, top); }
            if (drawRight) { this.ctx.lineTo(right, bottom); } else { this.ctx.moveTo(right, bottom); }
            if (drawBottom) { this.ctx.lineTo(left, bottom); } else { this.ctx.moveTo(left, bottom); }
            this.ctx.stroke();
        }
    }


    drawBackground() {
        this.ctx.save();
        this.ctx.translate(this.plotOffset.left, this.plotOffset.top);

        this.ctx.fillStyle = getColorOrGradient(
            this.options.grid.backgroundColor,
            this.plotHeight,
            0,
            'rgba(255, 255, 255, 0)',
            this.ctx,
        );
        this.ctx.fillRect(0, 0, this.plotWidth, this.plotHeight);
        this.ctx.restore();
    }

    drawGrid() {
        const allAxes = this.allAxes();

        this.ctx.save();
        this.ctx.translate(this.plotOffset.left, this.plotOffset.top);

        // draw markings
        let { markings } = this.options.grid;
        if (markings) {
            if (typeof markings === 'function') {
                const axes = this.plot.getAxes();
                // xmin etc. is backwards compatibility, to be
                // removed in the future
                axes.xmin = axes.xaxis.min;
                axes.xmax = axes.xaxis.max;
                axes.ymin = axes.yaxis.min;
                axes.ymax = axes.yaxis.max;

                markings = markings(axes);
            }

            for (let i = 0; i < markings.length; i += 1) {
                const m = markings[i];
                const xrange = extractRange(m, 'x', allAxes);
                const yrange = extractRange(m, 'y', allAxes);

                // fill in missing
                if (xrange.from == null) {
                    xrange.from = xrange.axis.min;
                }
                if (xrange.to == null) {
                    xrange.to = xrange.axis.max;
                }
                if (yrange.from == null) {
                    yrange.from = yrange.axis.min;
                }
                if (yrange.to == null) {
                    yrange.to = yrange.axis.max;
                }

                // clip
                if (
                    xrange.to < xrange.axis.min
                    || xrange.from > xrange.axis.max
                    || yrange.to < yrange.axis.min
                    || yrange.from > yrange.axis.max
                ) {
                    continue;
                }

                xrange.from = Math.max(xrange.from, xrange.axis.min);
                xrange.to = Math.min(xrange.to, xrange.axis.max);
                yrange.from = Math.max(yrange.from, yrange.axis.min);
                yrange.to = Math.min(yrange.to, yrange.axis.max);

                const xequal = xrange.from === xrange.to;
                const yequal = yrange.from === yrange.to;
                if (xequal && yequal) {
                    continue;
                }

                // then draw
                xrange.from = Math.floor(xrange.axis.p2c(xrange.from));
                xrange.to = Math.floor(xrange.axis.p2c(xrange.to));
                yrange.from = Math.floor(yrange.axis.p2c(yrange.from));
                yrange.to = Math.floor(yrange.axis.p2c(yrange.to));

                if (xequal || yequal) {
                    const lineWidth = m.lineWidth || this.options.grid.markingsLineWidth;
                    const subPixel = lineWidth % 2 ? 0.5 : 0;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = m.color || this.options.grid.markingsColor;
                    this.ctx.lineWidth = lineWidth;
                    if (xequal) {
                        this.ctx.moveTo(xrange.to + subPixel, yrange.from);
                        this.ctx.lineTo(xrange.to + subPixel, yrange.to);
                    } else {
                        this.ctx.moveTo(xrange.from, yrange.to + subPixel);
                        this.ctx.lineTo(xrange.to, yrange.to + subPixel);
                    }
                    this.ctx.stroke();
                } else {
                    this.ctx.fillStyle = m.color || this.options.grid.markingsColor;
                    this.ctx.fillRect(
                        xrange.from,
                        yrange.to,
                        xrange.to - xrange.from,
                        yrange.from - yrange.to,
                    );
                }
            }
        }

        // draw the ticks
        let bw = this.options.grid.borderWidth;
        for (let i = 0; i < allAxes.length; i += 1) {
            const axis = allAxes[i];
            const { box } = axis;
            const t = axis.tickLength;
            let y;
            let x;
            let xoff;
            let yoff;
            if (!axis.show || axis.ticks.length === 0) {
                continue;
            }

            this.ctx.lineWidth = 1;

            // find the edges
            if (axis.direction === 'x') {
                x = 0;
                if (t === 'full') {
                    y = (axis.position === 'top' ? 0 : this.plotHeight);
                } else {
                    y = box.top - this.plotOffset.top + (axis.position === 'top' ? box.height : 0);
                }
            } else {
                y = 0;
                if (t === 'full') {
                    x = (axis.position === 'left' ? 0 : this.plotWidth);
                } else {
                    x = box.left - this.plotOffset.left + (axis.position === 'left' ? box.width : 0);
                }
            }

            // draw tick bar
            if (!axis.innermost) {
                this.ctx.strokeStyle = axis.options.color;
                this.ctx.beginPath();

                xoff = 0;
                yoff = 0;
                if (axis.direction === 'x') {
                    xoff = this.plotWidth + 1;
                } else {
                    yoff = this.plotHeight + 1;
                }

                if (this.ctx.lineWidth === 1) {
                    if (axis.direction === 'x') {
                        y = Math.floor(y) + 0.5;
                    } else {
                        x = Math.floor(x) + 0.5;
                    }
                }

                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + xoff, y + yoff);
                this.ctx.stroke();
            }

            // draw ticks
            this.ctx.strokeStyle = axis.options.tickColor;
            this.ctx.beginPath();
            for (let j = 0; j < axis.ticks.length; j += 1) {
                const { v } = axis.ticks[j];
                xoff = 0;
                yoff = 0;

                if (
                    Number.isNaN(v)
                    || v < axis.min
                    || v > axis.max
                    // skip those lying on the axes if we got a border
                    || (
                        t === 'full'
                        && ((typeof bw === 'object' && bw[axis.position] > 0) || bw > 0)
                        && (v === axis.min || v === axis.max)
                    )
                ) {
                    continue;
                }

                if (axis.direction === 'x') {
                    x = axis.p2c(v);
                    yoff = (t === 'full' ? -this.plotHeight : t);
                    if (axis.position === 'top') {
                        yoff = -yoff;
                    }
                } else {
                    y = axis.p2c(v);
                    xoff = t === 'full' ? -this.plotWidth : t;
                    if (axis.position === 'left') {
                        xoff = -xoff;
                    }
                }

                if (this.ctx.lineWidth === 1) {
                    if (axis.direction === 'x') {
                        x = Math.floor(x) + 0.5;
                    } else {
                        y = Math.floor(y) + 0.5;
                    }
                }

                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + xoff, y + yoff);
            }

            this.ctx.stroke();
        }

        // draw border
        if (bw) {
            // If either borderWidth or borderColor is an object, then draw the border
            // line by line instead of as one rectangle
            let bc = this.options.grid.borderColor;
            if (typeof bw === 'object' || typeof bc === 'object') {
                if (typeof bw !== 'object') {
                    bw = {
                        top: bw, right: bw, bottom: bw, left: bw,
                    };
                }
                if (typeof bc !== 'object') {
                    bc = {
                        top: bc, right: bc, bottom: bc, left: bc,
                    };
                }

                if (bw.top > 0) {
                    this.ctx.strokeStyle = bc.top;
                    this.ctx.lineWidth = bw.top;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0 - bw.left, 0 - bw.top / 2);
                    this.ctx.lineTo(this.plotWidth, 0 - bw.top / 2);
                    this.ctx.stroke();
                }

                if (bw.right > 0) {
                    this.ctx.strokeStyle = bc.right;
                    this.ctx.lineWidth = bw.right;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.plotWidth + bw.right / 2, 0 - bw.top);
                    this.ctx.lineTo(this.plotWidth + bw.right / 2, this.plotHeight);
                    this.ctx.stroke();
                }

                if (bw.bottom > 0) {
                    this.ctx.strokeStyle = bc.bottom;
                    this.ctx.lineWidth = bw.bottom;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.plotWidth + bw.right, this.plotHeight + bw.bottom / 2);
                    this.ctx.lineTo(0, this.plotHeight + bw.bottom / 2);
                    this.ctx.stroke();
                }

                if (bw.left > 0) {
                    this.ctx.strokeStyle = bc.left;
                    this.ctx.lineWidth = bw.left;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0 - bw.left / 2, this.plotHeight + bw.bottom);
                    this.ctx.lineTo(0 - bw.left / 2, 0);
                    this.ctx.stroke();
                }
            } else {
                this.ctx.lineWidth = bw;
                this.ctx.strokeStyle = this.options.grid.borderColor;
                this.ctx.strokeRect(-bw / 2, -bw / 2, this.plotWidth + bw, this.plotHeight + bw);
            }
        }

        this.ctx.restore();
    }

    drawAxisLabels() {
        const allAxes = this.allAxes();
        for (let ix = 0; ix < allAxes.length; ix += 1) {
            const axis = allAxes[ix];
            const { box } = axis;
            const legacyStyles = `${axis.direction}Axis ${axis.direction}${axis.n}Axis`;
            const layer = `flot-${axis.direction}-axis flot-${axis.direction}${axis.n}-axis ${legacyStyles}`;
            const font = axis.options.font || 'flot-tick-label tickLabel';

            // Remove text before checking for axis.show and ticks.length;
            // otherwise plugins, like flot-tickrotor, that draw their own
            // tick labels will end up with both theirs and the defaults.
            this.surface.removeText(layer);

            if (!axis.show || axis.ticks.length === 0) {
                continue;
            }

            for (let i = 0; i < axis.ticks.length; i += 1) {
                const tick = axis.ticks[i];
                let x;
                let y;
                let valign;
                let halign;
                if (!tick.label || tick.v < axis.min || tick.v > axis.max) {
                    continue;
                }

                if (axis.direction === 'x') {
                    halign = 'center';
                    x = this.plotOffset.left + axis.p2c(tick.v);
                    if (axis.position === 'bottom') {
                        y = box.top + box.padding;
                    } else {
                        y = box.top + box.height - box.padding;
                        valign = 'bottom';
                    }
                } else {
                    valign = 'middle';
                    y = this.plotOffset.top + axis.p2c(tick.v);
                    if (axis.position === 'left') {
                        x = box.left + box.width - box.padding;
                        halign = 'right';
                    } else {
                        x = box.left + box.padding;
                    }
                }

                this.surface.addText(layer, x, y, tick.label, font, null, null, halign, valign);
            }
        }
    }

    // TODO: [vs] move it into separate module
    insertLegend() {
        if (this.options.legend.container != null) {
            html(this.options.legend.container, '');
        } else {
            remove(this.placeholder, '.legend');
        }
        if (!this.options.legend.show) {
            return;
        }
        const fragments = [];
        const entries = [];
        let rowStarted = false;
        const lf = this.options.legend.labelFormatter;

        // Build a list of legend entries, with each having a label and a color
        for (let i = 0; i < this.series.length; i += 1) {
            const s = this.series[i];
            if (s.label) {
                const label = lf ? lf(s.label, s) : s.label;
                if (label) {
                    entries.push({ label, color: s.color });
                }
            }
        }

        // Sort the legend using either the default or a custom comparator
        if (this.options.legend.sorted) {
            if (typeof this.options.legend.sorted === 'function') {
                entries.sort(this.options.legend.sorted);
            } else if (this.options.legend.sorted === 'reverse') {
                entries.reverse();
            } else {
                const ascending = this.options.legend.sorted !== 'descending';
                entries.sort((a, b) => {
                    if (a.label === b.label) {
                        return 0;
                    }
                    if ((a.label < b.label) !== ascending) {
                        return 1;
                    }
                    return -1;
                });
            }
        }

        // Generate markup for the list of entries, in their final order
        for (let i = 0; i < entries.length; i += 1) {
            const entry = entries[i];
            if (i % this.options.legend.noColumns === 0) {
                if (rowStarted) {
                    fragments.push('</tr>');
                }
                fragments.push('<tr>');
                rowStarted = true;
            }

            fragments.push(`<td class="legendColorBox"><div style="border:1px solid ${this.options.legend.labelBoxBorderColor};padding:1px">`
                + `<div style="width:4px;height:0;border:5px solid ${entry.color};overflow:hidden"></div></div></td>`
                + `<td class="legendLabel">${entry.label}</td>`);
        }

        if (rowStarted) {
            fragments.push('</tr>');
        }

        if (fragments.length === 0) {
            return;
        }
        const table = `<table style="font-size:smaller;color:${this.options.grid.color}">${fragments.join('')}</table>`;
        if (this.options.legend.container != null) {
            html(this.options.legend.container, table);
        } else {
            let pos = '';
            const p = this.options.legend.position;
            let m = this.options.legend.margin;
            if (m[0] == null) {
                m = [m, m];
            }
            if (p.charAt(0) === 'n') {
                pos += `top:${m[1] + this.plotOffset.top}px;`;
            } else if (p.charAt(0) === 's') {
                pos += `bottom:${m[1] + this.plotOffset.bottom}px;`;
            }
            if (p.charAt(1) === 'e') {
                pos += `right:${m[0] + this.plotOffset.right}px;`;
            } else if (p.charAt(1) === 'w') {
                pos += `left:${m[0] + this.plotOffset.left}px;`;
            }
            appendTo(this.placeholder, `<div class="legend">${table.replace('style="', `style="position:absolute;${pos};`)}</div>`);
            const legend = getChildren(this.placeholder, '.legend');
            if (this.options.legend.backgroundOpacity !== 0.0) {
                // put in the transparent background
                // separately to avoid blended labels and
                // label boxes
                let c = this.options.legend.backgroundColor;
                if (c == null) {
                    c = this.options.grid.backgroundColor;
                    if (c && typeof c === 'string') {
                        c = new ColorHelper(c);
                    } else {
                        const style = extractColor(legend, 'background-color');
                        c = new ColorHelper(style);
                    }
                    c.a = 1;
                    c = c.toString();
                }
                const div = getChildren(legend);
                const box = `<div style="position:absolute;width:${getWidth(div)}px;height:${getHeight(div)}px;${pos}background-color:${c};"> </div>`;
                const boxElm = prependTo(legend, box);
                setStyle(boxElm, { opacity: this.options.legend.backgroundOpacity });
            }
        }
    }

    // #endregion
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
                    if (x - mx > maxx || x - mx < -maxx
                       || y - my > maxy || y - my < -maxy) {
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
                if (h.auto === eventname
                   && !(item && h.series === item.series
                   && h.point[0] === item.datapoint[0]
                   && h.point[1] === item.datapoint[1])) {
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

            axisOptions = extend(true, {}, this.options.xaxis, axisOptions);
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

    bindEvents() {
        // bind events
        if (this.options.grid.hoverable) {
            this.eventHolder.addEventListener('mousemove', this.onMouseMove);
            this.eventHolder.addEventListener('mouseleave', this.onMouseLeave);
        }
        if (this.options.grid.clickable) {
            this.eventHolder.addEventListener('click', this.onClick);
        }
        this.executeHooks(this.hooks.bindEvents, [this.eventHolder]);
    }

    unbindEvents() {
        this.eventHolder.removeEventListener('mousemove', this.onMouseMove);
        this.eventHolder.removeEventListener('mouseleave', this.onMouseLeave);
        this.eventHolder.removeEventListener('click', this.onClick);
    }

    shutdown() {
        if (this.redrawTimeout) {
            this.clearTimeout(this.redrawTimeout);
        }

        this.unbindEvents();

        this.executeHooks(this.hooks.shutdown, [this.eventHolder]);
    }

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
