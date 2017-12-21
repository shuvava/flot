/**
 * Vanilla js implementation of function
 */
import { hasOwnProperty } from './flot-fn';

/**
 * vanilla implementation of jQuery children Fn
 * @param {element} element start point to search
 * @param {string} selector List of classes to apply to lookup
 */
function getChildren(element, selector) {
    return element.querySelectorAll(selector);
}

/**
 * vanilla implementation of jQuery css Fn
 * @param {element} element Element of DOM
 * @param {object} styles Object with styles to setup
 */
function setStyle(element, styles) {
    for (const prop in styles) { // eslint-disable-line no-restricted-syntax
        if (hasOwnProperty.call(styles, prop)) {
            element.style[prop] = styles[prop];
        }
    }
}

function noop() {}

export {
    getChildren,
    setStyle,
    noop,
};
