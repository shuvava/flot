/* Flot plugin for selecting regions of a plot.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

The plugin supports these options:

selection: {
    mode: null or "x" or "y" or "xy",
    color: color,
    shape: "round" or "miter" or "bevel",
    minSize: number of pixels
}

Selection support is enabled by setting the mode to one of "x", "y" or "xy".
In "x" mode, the user will only be able to specify the x range, similarly for
"y" mode. For "xy", the selection becomes a rectangle where both ranges can be
specified. "color" is color of the selection (if you need to change the color
later on, you can get to it with plot.getOptions().selection.color). "shape"
is the shape of the corners of the selection.

"minSize" is the minimum size a selection can be in pixels. This value can
be customized to determine the smallest size a selection can be and still
have the selection rectangle be displayed. When customizing this value, the
fact that it refers to pixels, not axis units must be taken into account.
Thus, for example, if there is a bar graph in time mode with BarWidth set to 1
minute, setting "minSize" to 1 will not make the minimum selection size 1
minute, but rather 1 pixel. Note also that setting "minSize" to 0 will prevent
"plotunselected" events from being fired when the user clicks the mouse without
dragging.

When selection support is enabled, a "plotselected" event will be emitted on
the DOM element you passed into the plot function. The event handler gets a
parameter with the ranges selected on the axes, like this:

    placeholder.bind( "plotselected", function( event, ranges ) {
        alert("You selected " + ranges.xaxis.from + " to " + ranges.xaxis.to)
        // similar for yaxis - with multiple axes, the extra ones are in
        // x2axis, x3axis, ...
    });

The "plotselected" event is only fired when the user has finished making the
selection. A "plotselecting" event is fired during the process with the same
parameters as the "plotselected" event, in case you want to know what's
happening while it's happening,

A "plotunselected" event with no arguments is emitted when the user clicks the
mouse to remove the selection. As stated above, setting "minSize" to 0 will
destroy this behavior.

The plugin allso adds the following methods to the plot object:

- setSelection( ranges, preventEvent )

  Set the selection rectangle. The passed in ranges is on the same form as
  returned in the "plotselected" event. If the selection mode is "x", you
  should put in either an xaxis range, if the mode is "y" you need to put in
  an yaxis range and both xaxis and yaxis if the selection mode is "xy", like
  this:

    setSelection({ xaxis: { from: 0, to: 10 }, yaxis: { from: 40, to: 60 } });

  setSelection will trigger the "plotselected" event when called. If you don't
  want that to happen, e.g. if you're inside a "plotselected" handler, pass
  true as the second parameter. If you are using multiple axes, you can
  specify the ranges on any of those, e.g. as x2axis/x3axis/... instead of
  xaxis, the plugin picks the first one it sees.

- clearSelection( preventEvent )

  Clear the selection rectangle. Pass in true to avoid getting a
  "plotunselected" event.

- getSelection()

  Returns the current selection in the same format as the "plotselected"
  event. If there's currently no selection, the function returns null.

*/
import {
    trigger, on, once, unbind, offset as getOffset,
} from './flot-fn-jquery';
import ColorHelper from './colorhelper';

const _MODE_TYPE_ = 'selection';

const options = {
    selection: {
        mode: null, // one of null, "x", "y" or "xy"
        color: '#e8cfac',
        shape: 'round', // one of "round", "miter", or "bevel"
        minSize: 5, // minimum number of pixels
    },
};

function clamp(min, value, max) {
    // eslint-disable-next-line no-nested-ternary
    return value < min ? min : (value > max ? max : value);
}

class PlotSelection {
    constructor(plot) {
        this.plot = plot;
        this.selection = {
            first: { x: -1, y: -1 },
            second: { x: -1, y: -1 },
            show: false,
            active: false,
        };
        // FIXME: The drag handling implemented here should be
        // abstracted out, there's some similar code from a library in
        // the navigation plugin, this should be massaged a bit to fit
        // the Flot cases here better and reused. Doing this would
        // make this plugin much slimmer.
        this.savedhandlers = {};
        this.mouseUpHandler = null;

        plot.clearSelection = this.clearSelection.bind(this);
        plot.setSelection = this.setSelection.bind(this);
        plot.getSelection = this.getSelection.bind(this);
    }

    onMouseMove(e) {
        if (this.selection.active) {
            this.updateSelection(e);

            trigger(this.plot.getPlaceholder(), 'plotselecting', [getSelection()]);
        }
    }

    onMouseDown(e) {
        if (e.which !== 1) { // only accept left-click
            return;
        }
        console.log('onMouseDown');
        // cancel out any text selections
        document.body.focus();

        // prevent text selection and drag in old-school browsers
        if (document.onselectstart !== undefined && this.savedhandlers.onselectstart == null) {
            this.savedhandlers.onselectstart = document.onselectstart;
            document.onselectstart = () => false;
        }
        if (document.ondrag !== undefined && this.savedhandlers.ondrag == null) {
            this.savedhandlers.ondrag = document.ondrag;
            document.ondrag = () => false;
        }

        this.setSelectionPos(this.selection.first, e);

        this.selection.active = true;

        // this is a bit silly, but we have to use a closure to be
        // able to whack the same handler again
        this.mouseUpHandler = (e1) => { this.onMouseUp(e1); };

        once(document, 'mouseup', this.mouseUpHandler);
    }

    onMouseUp(e) {
        this.mouseUpHandler = null;
        console.log('onMouseUp');
        // revert drag stuff for old-school browsers
        if (document.onselectstart !== undefined) {
            document.onselectstart = this.savedhandlers.onselectstart;
        }
        if (document.ondrag !== undefined) {
            document.ondrag = this.savedhandlers.ondrag;
        }

        // no more dragging
        this.selection.active = false;
        this.updateSelection(e);

        if (this.selectionIsSane()) {
            this.triggerSelectedEvent();
        } else {
            // this counts as a clear
            trigger(this.plot.getPlaceholder(), 'plotunselected', []);
            trigger(this.plot.getPlaceholder(), 'plotselecting', [null]);
        }

        return false;
    }

    getSelection() {
        if (!this.selectionIsSane()) { return null; }

        if (!this.selection.show) { return null; }

        const r = {};
        const c1 = this.selection.first;
        const c2 = this.selection.second;
        const axes = this.plot.getAxes();
        // eslint-disable-next-line no-restricted-syntax
        for (const name in axes) {
            if ({}.hasOwnProperty.call(axes, name)) {
                const axis = axes[name];
                if (axis.used) {
                    const p1 = axis.c2p(c1[axis.direction]);
                    const p2 = axis.c2p(c2[axis.direction]);
                    r[name] = { from: Math.min(p1, p2), to: Math.max(p1, p2) };
                }
            }
        }

        return r;
    }

    triggerSelectedEvent() {
        const r = this.getSelection();

        trigger(this.plot.getPlaceholder(), 'plotselected', [r]);

        // backwards-compat stuff, to be removed in future
        if (r.xaxis && r.yaxis) {
            trigger(this.plot.getPlaceholder(), 'selected', [
                {
                    x1: r.xaxis.from,
                    y1: r.yaxis.from,
                    x2: r.xaxis.to,
                    y2: r.yaxis.to,
                },
            ]);
        }
    }

    setSelectionPos(pos, e) {
        const o = this.plot.getOptions();
        const offset = getOffset(this.plot.getPlaceholder());
        const plotOffset = this.plot.getPlotOffset();
        pos.x = clamp(0, e.pageX - offset.left - plotOffset.left, this.plot.width());
        pos.y = clamp(0, e.pageY - offset.top - plotOffset.top, this.plot.height());

        if (o.selection.mode === 'y') {
            pos.x = pos === this.selection.first ? 0 : this.plot.width();
        }

        if (o.selection.mode === 'x') {
            pos.y = pos === this.selection.first ? 0 : this.plot.height();
        }
    }

    updateSelection(pos) {
        if (pos.pageX == null) return;

        this.setSelectionPos(this.selection.second, pos);
        if (this.selectionIsSane()) {
            this.selection.show = true;
            this.plot.triggerRedrawOverlay();
        } else {
            this.clearSelection(true);
        }
    }

    clearSelection(preventEvent) {
        if (this.selection.show) {
            this.selection.show = false;
            this.plot.triggerRedrawOverlay();
            if (!preventEvent) {
                trigger(this.plot.getPlaceholder(), 'plotunselected', []);
            }
        }
    }

    extractRange(ranges, coord) {
        let axis;
        let from;
        let to;
        let key;
        const axes = this.plot.getAxes();

        // eslint-disable-next-line no-restricted-syntax
        for (const k in axes) {
            if ({}.hasOwnProperty.call(axes, k)) {
                axis = axes[k];
                if (axis.direction === coord) {
                    key = `${coord + axis.n}axis`;
                    if (!ranges[key] && axis.n === 1) {
                        key = `${coord}axis`; // support x1axis as xaxis
                    }
                    if (ranges[key]) {
                        ({ from, to } = ranges[key]);
                        break;
                    }
                }
            }
        }

        // backwards-compat stuff - to be removed in future
        if (!ranges[key]) {
            axis = coord === 'x' ? this.plot.getXAxes()[0] : this.plot.getYAxes()[0];
            from = ranges[`${coord}1`];
            to = ranges[`${coord}2`];
        }

        // auto-reverse as an added bonus
        if (from != null && to != null && from > to) {
            const tmp = from;
            from = to;
            to = tmp;
        }

        return { from: from, to: to, axis: axis };
    }

    setSelection(ranges, preventEvent) {
        const o = this.plot.getOptions();

        if (o.selection.mode === 'y') {
            this.selection.first.x = 0;
            this.selection.second.x = this.plot.width();
        } else {
            const range = this.extractRange(ranges, 'x');

            this.selection.first.x = range.axis.p2c(range.from);
            this.selection.second.x = range.axis.p2c(range.to);
        }

        if (o.selection.mode === 'x') {
            this.selection.first.y = 0;
            this.selection.second.y = this.plot.height();
        } else {
            const range = this.extractRange(ranges, 'y');

            this.selection.first.y = range.axis.p2c(range.from);
            this.selection.second.y = range.axis.p2c(range.to);
        }

        this.selection.show = true;
        this.plot.triggerRedrawOverlay();
        if (!preventEvent && this.selectionIsSane()) {
            this.triggerSelectedEvent();
        }
    }

    selectionIsSane() {
        const { minSize } = this.plot.getOptions().selection;
        return Math.abs(this.selection.second.x - this.selection.first.x) >= minSize
            && Math.abs(this.selection.second.y - this.selection.first.y) >= minSize;
    }
}

/**
 * Initialization of plugin
 * @param {*} plot chart object
 */
function init(plot) {
    const plotSelection = new PlotSelection(plot);
    plot.hooks.bindEvents.push((_plot, eventHolder) => {
        const o = _plot.getOptions();
        if (o.selection.mode != null) {
            on(eventHolder, 'mousemove', plotSelection.onMouseMove.bind(plotSelection));
            on(eventHolder, 'mousedown', plotSelection.onMouseDown.bind(plotSelection));
        }
    });
    plot.hooks.drawOverlay.push((_plot, ctx) => {
        // draw selection
        if (plotSelection.selection.show && plotSelection.selectionIsSane()) {
            const plotOffset = _plot.getPlotOffset();
            const o = _plot.getOptions();

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            const c = new ColorHelper(o.selection.color);

            ctx.strokeStyle = c.scale('a', 0.8).toString();
            ctx.lineWidth = 1;
            ctx.lineJoin = o.selection.shape;
            ctx.fillStyle = c.scale('a', 0.4).toString();

            const x = Math.min(plotSelection.selection.first.x, plotSelection.selection.second.x) + 0.5;
            const y = Math.min(plotSelection.selection.first.y, plotSelection.selection.second.y) + 0.5;
            const w = Math.abs(plotSelection.selection.second.x - plotSelection.selection.first.x) - 1;
            const h = Math.abs(plotSelection.selection.second.y - plotSelection.selection.first.y) - 1;

            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            ctx.restore();
        }
    });
    plot.hooks.shutdown.push((_plot, eventHolder) => {
        unbind(eventHolder, 'mousemove', plotSelection.onMouseMove);
        unbind(eventHolder, 'mousedown', plotSelection.onMouseDown);

        if (plotSelection.mouseUpHandler) {
            unbind(document, 'mouseup', plotSelection.mouseUpHandler);
        }
    });
}

// add plugin into plot object
// $.plot.plugins.push({
//     init: init,
//     options: options,
//     name: _MODE_TYPE_,
//     version: '1.0',
// });
export default Object.freeze({
    init: init,
    options: options,
    name: _MODE_TYPE_,
    version: '1.1',
});
