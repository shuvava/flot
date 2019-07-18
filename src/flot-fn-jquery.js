import $ from 'jquery';

/**
 * abstraction from jQuery children Fn
 * @param {element} element start point to search
 * @param {string} selector List of classes to apply to lookup
 */
function getChildren(element, selector) {
    if (!selector || selector === '') {
        return $(element).children();
    }
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
    return $(element).appendTo(root);
}

/**
 * abstraction from jQuery prependTo Fn
 * @param {element} root Element of DOM
 * @param {element} element Element of DOM
 */
function prependTo(root, element) {
    return $(element).prependTo(root);
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
 * @param {String} classes List CSS classes
 */
function addClass(element, classes) {
    $(element).addClass(classes);
}

/**
 * abstraction from jQuery hasClass Fn
 * @param {element} element Element of DOM
 * @param {String} cssClass CSS class
 */
function hasClass(element, cssClass) {
    return $(element).hasClass(cssClass);
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
function domData(element, id, obj) {
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

/**
 * abstraction from jQuery html Fn
 * @param {element} element Existing element of DOM
 * @param {String} htmlStr HTML code
 */
function html(element, htmlStr) {
    $(element).html(htmlStr);
}

/**
 * abstraction from jQuery html Fn
* @param {element} element Existing element of DOM
* @param {String} selector List of classes to apply to lookup
*/
function remove(element, selector) {
    $(element).find(selector).remove();
}

/**
 * extract value of specific style color property from element go up by DOM
 * @param {element} element Existing element of DOM
 * @param {String} css name of style property
 * @returns {String} color of element || 'transparent'
 */
function extractColor(element, css) {
    let _element = $(element);
    let style;
    do {
        style = _element.css(css).toLowerCase();
        if (style !== '' && style !== 'transparent') {
            break;
        }
        _element = _element.parent();
    } while (_element.length && !$.nodeName(_element.get(0), 'body'));
    // catch Safari's way of signalling transparent
    if (style && style === 'rgba(0, 0, 0, 0)') {
        return 'transparent';
    }
    return 'transparent';
}

/**
 * abstraction from jQuery width Fn
 * @param {element} element Existing element of DOM
 */
function getWidth(element) {
    return $(element).width();
}

/**
 * abstraction from jQuery height Fn
 * @param {element} element Existing element of DOM
 */
function getHeight(element) {
    return $(element).height();
}

/**
 * abstraction from jQuery outerWidth Fn
 * @param {element} element Existing element of DOM
 */
function outerWidth(element, withMargin = false) {
    return $(element).outerWidth(withMargin);
}

/**
 * abstraction from jQuery outerHeight Fn
 * @param {element} element Existing element of DOM
 * @param {Boolean} withMargin include margin
 */
function outerHeight(element, withMargin = false) {
    return $(element).outerHeight(withMargin);
}

/**
 * abstraction from jQuery hide Fn
 * @param {element} element Existing element of DOM
 */
function hide(element) {
    $(element).hide();
}

/**
 * abstraction from jQuery show Fn
 * @param {element} element Existing element of DOM
 */
function show(element) {
    $(element).show();
}

/**
 * abstraction from jQuery trigger Fn
 * @param {element} element Existing element of DOM
 * @param {eventType} event event to trigger
 * @param {array<Any>} args custom arguments
 */
function trigger(element, event, args) {
    $(element).trigger(event, args);
}

/**
 * abstraction from jQuery one Fn
 * @param {element} element Existing element of DOM
 * @param {string} event event to trigger
 * @param {function} callback callback function
 */
function once(element, event, callback) {
    $(element).one(event, callback);
}

/**
 * abstraction from jQuery on Fn
 * @param {element} element Existing element of DOM
 * @param {string} event event to trigger
 * @param {function} callback callback function
 */
function on(element, event, callback) {
    $(element).on(event, callback);
}

/**
 * abstraction from jQuery unbind Fn
 * @param {element} element Existing element of DOM
 * @param {string} event event to trigger
 * @param {function} callback callback function
 */
function unbind(element, event, callback) {
    $(element).unbind(event, callback);
}

export {
    getChildren,
    getStyle,
    setStyle,
    appendTo,
    prependTo,
    detach,
    addClass,
    hasClass,
    insertAfter,
    clone,
    extend,
    offset,
    domData,
    removeData,
    empty,
    html,
    remove,
    extractColor,
    getWidth,
    getHeight,
    outerWidth,
    outerHeight,
    hide,
    show,
    trigger,
    on,
    once,
    unbind,
};
