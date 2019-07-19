// import 'babel-polyfill';
import $ from 'jquery'; // eslint-disable-line no-unused-vars
// import '../bak/jquery.flot';
import Plot from './plot';
import flotCategories from './flot-categories'; // this plugin should be added at first, crush page in other case
import flotStack from './flot-stack';
import flotFillBetween from './flot-fillbetween';
import flotTime from './flot-time';
import flotCanvas from './flot-canvas';
import {
    pluginConfig as flotImage,
    loadDataImages,
} from './flot-image';
import ColorHelper from './colorhelper';
import flotResize from './flot-resize';
import flotSelection from './flot-selection';
import flotErrorBars from './flot-errorbars';

if (window.$) {
    window.$.plot = (placeholder, data, options) => {
        const t0 = new Date();
        const plot = new Plot(placeholder, data, options, $.plot.plugins);
        if (!window.PRODUCTION) {
            console.log(`time used (msecs): ${(new Date()).getTime() - t0.getTime()}`);
        }
        return plot;
    };
    window.$.plot.version = '0.8.3';
    window.$.plot.plugins = [];
    window.$.fn.plot = function plotInit(data, options) {
        return this.each((index, element) => {
            $.plot(element, data, options);
        });
    };
    window.$.plot.plugins.push(flotCategories);
    window.$.plot.plugins.push(flotStack);
    window.$.plot.plugins.push(flotFillBetween);
    window.$.plot.plugins.push(flotTime);
    window.$.plot.plugins.push(flotCanvas);
    window.$.plot.plugins.push(flotImage);
    window.$.plot.plugins.push(flotResize);
    window.$.plot.plugins.push(flotSelection);
    window.$.plot.plugins.push(flotErrorBars);
    window.$.plot.image = { loadDataImages };
}
/* example of using compile directives of webpack
in debug version it will be transformed into
```
if (!false) { ...}
```
in release version
```
if (!true) { ...}
```
and removed by uglifier
*/
if (!window.PRODUCTION) {
    console.log('debug version');
}

export {
    ColorHelper,
    Plot,
};
