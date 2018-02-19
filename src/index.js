/* globals PRODUCTION */
// import 'babel-polyfill';
import $ from 'jquery'; // eslint-disable-line no-unused-vars
// import '../bak/jquery.flot';
import Plot from './plot';
import flotCategories from './flot-categories'; // this plugin should be added at first, crush page in other case
import flotStack from './flot-stack';
import ColorHelper from './colorhelper';

if (window.$) {
    window.$.plot = (placeholder, data, options) => {
        const t0 = new Date();
        const plot = new Plot(window.$(placeholder), data, options, $.plot.plugins);
        (window.console ? console.log : alert)(`time used (msecs): ${(new Date()).getTime() - t0.getTime()}`);
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
if (!PRODUCTION) {
    console.log('debug version');
}

export {
    ColorHelper,
    Plot,
};
