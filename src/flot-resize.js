/* Flot plugin for automatically redrawing plots as the placeholder resizes.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

It works by listening for changes on the placeholder div (through the jQuery
resize event plugin) - if the size changes, it will redraw the plot.

There are no options. If you need to disable the plugin for some plots, you
can just fix the size of their placeholders.

*/
const _MODE_TYPE_ = 'resize';

const options = {
    // no options
};

function onResize(plot, entries) {
    entries.forEach((entry) => {
        if (entry.contentRect.width === 0 || entry.contentRect.height === 0) {
            return;
        }
        plot.resize();
        plot.setupGrid();
        plot.draw();
    });
}

/**
 * Initialization of plugin
 * @param {*} plot chart object
 */
function init(plot) {
    let resizeObserver = null;
    plot.hooks.bindEvents.push(() => {
        resizeObserver = new ResizeObserver(entries => onResize(plot, entries));
        const placeholder = plot.getPlaceholder();
        resizeObserver.observe(placeholder);
    });
    plot.hooks.shutdown.push(() => resizeObserver.disconnect());
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
    version: '1.0',
});
