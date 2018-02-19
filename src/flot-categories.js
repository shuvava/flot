// import $ from 'jquery';
// import 'Flot';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import findIndex from 'lodash/findIndex';

const _MODE_TYPE_ = 'categories';

const options = {
    xaxis: {
        categories: null,
        indexGenerator: null,
    },
    yaxis: {
        categories: null,
        indexGenerator: null,
    },
};

/**
 * default implementation of tick(label) generation by index
 * maybe overridden in chart config
 * @param {Number} val Index of tick(label)
 * @param {*} axis configuration of current axis
 */
function tickFormatter(val, axis) {
    if (!axis.categories || val >= axis.categories.length) {
        return '';
    }
    return axis.categories[val][1];
}

/**
 * look for index of specific data item
 * @param {*} category element of array categories
 * @param {*} categories array of possible categories(non integer graph data items)
 */
function indexGenerator(category, categories) {
    const index = findIndex(categories, item => item === category);
    if (index === -1) {
        categories.push([categories.length, category]);
        return categories.length - 1;
    }
    return index;
}

/**
 * Generate default data format for chart options
 * @param {Object} series options(settings) of axises
 */
function defaultFormationOptions(series) {
    const format = [];
    format.push({ x: true, number: true, required: true });
    format.push({ y: true, number: true, required: true });

    if (series.bars.show || (series.lines.show && series.lines.fill)) {
        const autoScale = !!((series.bars.show && series.bars.zero) || (series.lines.show && series.lines.zero));
        format.push({
            y: true, number: true, required: false, defaultValue: 0, autoscale: autoScale,
        });
        if (series.bars.horizontal) {
            delete format[format.length - 1].y;
            format[format.length - 1].x = true;
        }
    }
    return format;
}

/**
 * customize chart's data parsing options
 * @param {Object} plot chart object
 * @param {Object} series options(settings) of axises
 * @param {Array.<Array.<String|Number>>} data chart data
 * @param {Object} points internal chart object
 */
function processRawData(plot, series, data, points) {
    // if categories are enabled, we need to disable
    // auto-transformation to numbers so the strings are intact
    // for later processing

    const xCategories = series.xaxis.options.mode === _MODE_TYPE_;
    const xIndexGenFn = series.xaxis.options.indexGenerator || indexGenerator;
    const yCategories = series.yaxis.options.mode === _MODE_TYPE_;
    const yIndexGenFn = series.yaxis.options.indexGenerator || indexGenerator;

    if (!(xCategories || yCategories)) { return; }

    // according to code of jquery.flot.js it is always empty
    if (!points.format) {
        points.format = defaultFormationOptions(series);
    }

    forEach(points.format, (fm) => {
        if (fm.x && xCategories) {
            fm.number = false;
            fm.indexGenerator = xIndexGenFn;
        }
        if (fm.y && yCategories) {
            fm.number = false;
            fm.indexGenerator = yIndexGenFn;
        }
    });
}

/**
 * Default ticks generator
 * Generally should be setup in {xaxis, yaxis.ticks}
 * @param {*} axis axis settings
 */
function categoriesTickGenerator(categories) {
    return categories;
}

/**
 * Custom data transform function runner
 * @param {*} pointsObj internal chart object
 * @param {*} axis axis settings
 * @param {Array.<Array<Number|String>>} categories array of object to bind data to label on axis [ [number, "StringLabel"], ...]
 */
function transformPointsOnAxis(pointsObj, axis, categories) {
    // go through the points, transforming them
    const { points, pointsize, format } = pointsObj;

    for (let i = 0; i < points.length; i += pointsize) {
        if (points[i] == null) { continue; }

        for (let m = 0; m < pointsize; ++m) {// eslint-disable-line
            const val = points[i + m];
            if (format[m].number === false && format[m].indexGenerator) {
                points[i + m] = format[m].indexGenerator(val, categories);
            }
        }
    }
}

/**
 * setup parameters of axis for current instance of Plot(Chart) object
 * @param {*} series options(settings) of axises
 * @param {*} axis axis type
 * @param {*} dataPoints internal chart object
 */
function setupCategoriesForAxis(series, axis, dataPoints) {
    if (series[axis].options.mode !== _MODE_TYPE_) { return; }

    if (!series[axis].categories) {
        // parse options
        const categories = [];
        const originalObj = series[axis].options.categories || {};
        const _indexGenerator = series[axis].options.indexGenerator || indexGenerator;
        // convert settings
        if (isArray(originalObj)) {
            forEach(originalObj, (category) => { _indexGenerator(category, categories); });
        } else {
            forEach(Object.keys(originalObj), (property) => { _indexGenerator(property, categories); });
        }

        series[axis].categories = categories;
    }

    // fix ticks (add custom ticks generator)
    if (!series[axis].options.ticks) {
        series[axis].options.ticks = categoriesTickGenerator.bind(null, series[axis].categories);
    }
    // fix ticks (add custom ticks formatter)
    if (!series[axis].options.tickFormatter) {
        series[axis].options.tickFormatter = tickFormatter;
    }

    transformPointsOnAxis(dataPoints, axis, series[axis].categories);
}

function processDatapoints(plot, series, dataPoints) {
    setupCategoriesForAxis(series, 'xaxis', dataPoints);
    setupCategoriesForAxis(series, 'yaxis', dataPoints);
}

/**
 * Initialization of plugin
 * @param {*} plot chart object
 */
function init(plot) {
    plot.hooks.processRawData.push(processRawData);
    plot.hooks.processDatapoints.push(processDatapoints);
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
