/* globals PRODUCTION */
// import 'babel-polyfill';
import $ from 'jquery'; // eslint-disable-line no-unused-vars
import '../bak/jquery.flot';
import './flot-categories'; // this plugin should be added at first, crush page in other case
import './flot-stack';
import ColorHelper from './colorhelper';

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
};
