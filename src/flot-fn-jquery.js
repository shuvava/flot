import $ from 'jquery';

/**
 * abstraction from jQuery children Fn
 * @param {element} element start point to search
 * @param {string} selector List of classes to apply to lookup
 */
function getChildren(element, selector) {
    return $(element).children(selector);
}

/**
 * abstraction from jQuery css Fn
 * @param {element} element Element of DOM
 * @param {object} styles Object with styles to setup
 */
function setStyle(element, styles) {
    $(element).css(styles);
}

export {
    getChildren,
    setStyle,
};
