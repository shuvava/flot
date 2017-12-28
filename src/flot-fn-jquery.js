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

/**
 * abstraction from jQuery css Fn
 * @param {element} element Element of DOM
 * @param {string} style css property name
 */
function getStyle(element, style) {
    return $(element).css(style);
}

/**
 * abstraction from jQuery appendTo Fn
 * @param {element} root Element of DOM
 * @param {element} element Element of DOM
 */
function appendTo(root, element) {
    $(element).appendTo(root);
}

/**
 * abstraction from jQuery detach Fn
 * @param {element} element Element of DOM
 */
function detach(element) {
    $(element).detach();
}

/**
 * abstraction from jQuery addClass Fn
 * @param {element} element Element of DOM
 * @param {string} classes List CSS classes
 */
function addClass(element, classes) {
    $(element).addClass(classes);
}

/**
 * abstraction from jQuery addClass Fn
 * @param {element} targetElement Existing element of DOM
 * @param {element} newElement New element of DOM
 */
function insertAfter(targetElement, newElement) {
    $(newElement).insertAfter($(targetElement));
}

/**
 * abstraction from jQuery clone Fn
 * @param {element} element Existing element of DOM
 * @return {element} New element of DOM
 */
function clone(element) {
    return $(element).clone();
}

/**
 * abstraction from jQuery extend Fn
 */
function extend(...args) {
    return $.extend.apply(this, args);
}

/**
 * abstraction from jQuery offset Fn
 * @param {element} element Existing element of DOM
 */
function offset(element) {
    return $(element).offset();
}

/**
 * abstraction from jQuery data Fn
 * @param {element} element Existing element of DOM
 * @param {string} id Custom property id
 * @param {object} obj Object to store
 */
function data(element, id, obj) {
    if (obj != null) {
        $(element).data(id, obj);
    } else {
        obj = $(element).data(id);
    }
    return obj;
}

/**
 * abstraction from jQuery removeData Fn
 * @param {element} element Existing element of DOM
 * @param {string} id Custom property id
 */
function removeData(element, id) {
    $(element).removeData(id);
}

/**
 * abstraction from jQuery empty Fn
 * @param {element} element Existing element of DOM
 */
function empty(element) {
    $(element).empty();
}

export {
    getChildren,
    getStyle,
    setStyle,
    appendTo,
    detach,
    addClass,
    insertAfter,
    clone,
    extend,
    offset,
    data,
    removeData,
    empty,
};
