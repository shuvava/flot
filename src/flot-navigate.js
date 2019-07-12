/** *
lot plugin for adding the ability to pan and zoom the plot.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

The default behaviour is double click and scrollwheel up/down to zoom in, drag
to pan. The plugin defines plot.zoom({ center }), plot.zoomOut() and
plot.pan( offset ) so you easily can add custom controls. It also fires
"plotpan" and "plotzoom" events, useful for synchronizing plots.

The plugin supports these options:

    zoom: {
        interactive: false
        trigger: "dblclick" // or "click" for single click
        amount: 1.5         // 2 = 200% (zoom in), 0.5 = 50% (zoom out)
    }

    pan: {
        interactive: false
        cursor: "move"      // CSS mouse cursor value used when dragging, e.g. "pointer"
        frameRate: 20
    }

    xaxis, yaxis, x2axis, y2axis: {
        zoomRange: null  // or [ number, number ] (min range, max range) or false
        panRange: null   // or [ number, number ] (min, max) or false
    }

"interactive" enables the built-in drag/click behaviour. If you enable
interactive for pan, then you'll have a basic plot that supports moving
around; the same for zoom.

"amount" specifies the default amount to zoom in (so 1.5 = 150%) relative to
the current viewport.

"cursor" is a standard CSS mouse cursor string used for visual feedback to the
user when dragging.

"frameRate" specifies the maximum number of times per second the plot will
update itself while the user is panning around on it (set to null to disable
intermediate pans, the plot will then not update until the mouse button is
released).

"zoomRange" is the interval in which zooming can happen, e.g. with zoomRange:
[1, 100] the zoom will never scale the axis so that the difference between min
and max is smaller than 1 or larger than 100. You can set either end to null
to ignore, e.g. [1, null]. If you set zoomRange to false, zooming on that axis
will be disabled.

"panRange" confines the panning to stay within a range, e.g. with panRange:
[-10, 20] panning stops at -10 in one end and at 20 in the other. Either can
be null, e.g. [-10, null]. If you set panRange to false, panning on that axis
will be disabled.

Example API usage:

    plot = $.plot(...);

    // zoom default amount in on the pixel ( 10, 20 )
    plot.zoom({ center: { left: 10, top: 20 } });

    // zoom out again
    plot.zoomOut({ center: { left: 10, top: 20 } });

    // zoom 200% in on the pixel (10, 20)
    plot.zoom({ amount: 2, center: { left: 10, top: 20 } });

    // pan 100 pixels to the left and 20 down
    plot.pan({ left: -100, top: 20 })

Here, "center" specifies where the center of the zooming should happen. Note
that this is defined in pixel space, not the space of the data points (you can
use the p2c helpers on the axes in Flot to help you convert between these).

"amount" is the amount to zoom the viewport relative to the current range, so
1 is 100% (i.e. no change), 1.5 is 150% (zoom in), 0.7 is 70% (zoom out). You
can set the default in the options.

 */

const _MODE_TYPE_ = 'navigate';

const OPTIONS = {
    xaxis: {
        zoomRange: null, // or [number, number] (min range, max range)
        panRange: null, // or [number, number] (min, max)
    },
    zoom: {
        interactive: false,
        trigger: 'dblclick', // or "click" for single click
        amount: 1.5, // how much to zoom relative to current position, 2 = 200% (zoom in), 0.5 = 50% (zoom out)
    },
    pan: {
        interactive: false,
        cursor: 'move',
        frameRate: 20,
    },
};

function bindEvents(plot, eventHolder) {
    const o = plot.getOptions();
    if (o.zoom.interactive) {
        eventHolder[o.zoom.trigger](onZoomClick);
        eventHolder.mousewheel(onMouseWheel);
    }

    if (o.pan.interactive) {
        eventHolder.bind('dragstart', { distance: 10 }, onDragStart);
        eventHolder.bind('drag', onDrag);
        eventHolder.bind('dragend', onDragEnd);
    }
}

function shutdown(plot, eventHolder) {
    eventHolder.unbind(plot.getOptions().zoom.trigger, onZoomClick);
    eventHolder.unbind('mousewheel', onMouseWheel);
    eventHolder.unbind('dragstart', onDragStart);
    eventHolder.unbind('drag', onDrag);
    eventHolder.unbind('dragend', onDragEnd);
    if (panTimeout) {
        clearTimeout(panTimeout);
    }
}

/**
 * Initialization of plugin
 * @param {*} plot chart object
 */
function init(plot) {
    plot.hooks.bindEvents.push(bindEvents);
    plot.hooks.shutdown.push(shutdown);
}

// add plugin into plot object
// $.plot.plugins.push({
//     init: init,
//     options: options,
//     name: _MODE_TYPE_,
//     version: '1.0',
// });
const pluginConfig = Object.freeze({
    init: init,
    options: OPTIONS,
    name: _MODE_TYPE_,
    version: '1.3',
});

export {
    pluginConfig,
    loadDataImages,
};
