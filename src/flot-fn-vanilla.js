/**
 * Vanilla js implementation of function
 */
import { hasOwnProperty } from './flot-fn';

/**
 * vanilla implementation of jQuery children Fn
 * @param {element} element start point to search
 * @param {String} selector List of classes to apply to lookup
 */
function getChildren(element, selector) {
    if (!selector || selector === '') {
        return element.childNodes;
    }
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

/**
 * vanilla implementation of jQuery css Fn
 * @param {element} element Element of DOM
 * @param {string} style css property name
 */
function getStyle(element, style) {
    return element.style[style];
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(htmlStr) {
    const template = document.createElement('template');
    htmlStr = htmlStr.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = htmlStr;
    return template.content.firstChild;
}

/**
 * vanilla implementation of jQuery appendTo Fn
 * @param {element} root Element of DOM
 * @param {element} element Element of DOM
 */
function appendTo(root, element) {
    if (typeof element === 'string') {
        element = htmlToElement(element);
    }
    root.appendChild(element);
    return element;
}

/**
 * vanilla implementation of jQuery prependTo Fn
 * @param {element} root Element of DOM
 * @param {element} element Element of DOM
 */
function prependTo(root, element) {
    if (typeof element === 'string') {
        element = htmlToElement(element);
    }
    let _fistChild = null;
    if (root.childNodes.length > 0) {
        _fistChild = root.childNodes[0]; // eslint-disable-line prefer-destructuring
    }
    root.insertBefore(element, _fistChild);
    return _fistChild;
}

/**
 * operation produces the same effect as detach, i.e. removing the element
 * @param {element} elements Element of DOM or array of DOM elements
 */
function detach(elements) {
    if (!(elements instanceof HTMLCollection)) {
        elements = [elements];
    }
    for (let i = elements.length - 1; i >= 0; i -= 1) {
        if (elements[i].parentNode) {
            elements[i].parentNode.removeChild(elements[i]);
        }
    }
}

/**
 * vanilla implementation of jQuery addClass Fn
 * @param {element} element Element of DOM
 * @param {string} classes List CSS classes
 */
function addClass(element, classes) {
    const cssList = classes.split(' ');
    for (let i = 0; i < cssList.length; i += 1) {
        if (!element.classList.contains(cssList[i])) {
            // this.classList.remove('bad');
            element.classList.add(cssList[i]);
        }
    }
}

/**
 * vanilla implementation of jQuery removeClass Fn
 * @param {element} element Element of DOM
 * @param {string} classes List CSS classes
 */
function removeClass(element, classes) {
    const cssList = classes.split(' ');
    for (let i = 0; i < cssList.length; i += 1) {
        if (element.classList.contains(cssList[i])) {
            element.classList.remove(cssList[i]);
        }
    }
}

/**
 * vanilla implementation of jQuery hasClass Fn
 * @param {element} element Element of DOM
 * @param {string} class List CSS classes
 */
function hasClass(element, cssClass) {
    return element.classList.contains(cssClass);
}

/**
 * vanilla implementation of jQuery addClass Fn
 * @param {element} targetElement Existing element of DOM
 * @param {element} newElement New element of DOM
 */
function insertAfter(targetElement, newElement) {
    // target is what you want it to go after. Look for this elements parent.
    const parent = targetElement.parentNode;

    // if the parents lastChild is the targetElement...
    if (parent.lastChild === targetElement) {
        // add the newElement after the target element.
        parent.appendChild(newElement);
    } else {
        // else the target has siblings, insert the new element between the target and it's next sibling.
        parent.insertBefore(newElement, targetElement.nextSibling);
    }
}

/**
 * vanilla implementation of jQuery clone Fn
 * @param {element} element Existing element of DOM
 * @return {element} New element of DOM
 */
function clone(element) {
    return element.cloneNode(true);
}

/**
 * Merge the object into the extended object
 * @param {Boolean} deep Do deep copy
 * @param {Object} extended Object to merge
 * @param {Object} obj original object
 */
function merge(deep, extended, obj) {
    for (const prop in obj) { // eslint-disable-line no-restricted-syntax
        if (hasOwnProperty.call(obj, prop)) {
            // If deep merge and property is an object, merge properties
            if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                extended[prop] = extend(true, extended[prop], obj[prop]);// eslint-disable-line no-use-before-define
            } else {
                extended[prop] = obj[prop];
            }
        }
    }
}

/**
 * vanilla implementation of jQuery extend Fn
 */
function extend(...args) {
    // Variables
    const extended = {};
    let deep = false;

    // Check if a deep merge
    if (Object.prototype.toString.call(args[0]) === '[object Boolean]') {
        deep = args.shift();
    }

    // Loop through each object and conduct a merge
    for (let i = 0; i < args.length; i += 1) {
        const obj = args[i];
        merge(deep, extended, obj);
    }

    return extended;
}

/**
 * vanilla implementation of jQuery offset Fn
 * @param {element} element Existing element of DOM
 */
function offset(element) {
    const rect = element.getBoundingClientRect();
    const { body } = document;

    return {
        top: rect.top + body.scrollTop,
        left: rect.left + body.scrollLeft,
    };
}

function _getDataAttribute(id) {
    return `data-${id}`;
}

/**
 * vanilla implementation of jQuery data Fn
 * @param {element} element Existing element of DOM
 * @param {string} id Custom property id
 * @param {object} obj Object to store
 */
function domData(element, id, obj) {
    const attr = _getDataAttribute(id);
    if (obj != null) {
        element.setAttribute(attr, JSON.stringify(obj));
    } else {
        const strJson = element.getAttribute(attr);
        if (strJson != null) {
            obj = JSON.parse(strJson);
        }
    }
    return obj;
}

/**
 * vanilla implementation of jQuery removeData Fn
 * @param {element} element Existing element of DOM
 * @param {string} id Custom property id
 */
function removeData(element, id) {
    const attr = _getDataAttribute(id);
    element.removeAttribute(attr);
}

/**
 * vanilla implementation of jQuery empty Fn
 * @param {element} element Existing element of DOM
 */
function empty(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * vanilla implementation of jQuery html Fn
 * @param {element} element Existing element of DOM
 * @param {String} htmlStr HTML code
 */
function html(element, htmlStr) {
    element.innerHTML = htmlStr;
}

/**
 * vanilla implementation of jQuery remove Fn
 * IE not supported
 * @param {element} element Existing element of DOM
 * @param {String} selector List of classes to apply to lookup
 */
function remove(element, selector) {
    const nodes = element.querySelectorAll(selector);
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        node.remove();
    }
}

/**
 * extract value of specific style color property from element go up by DOM
 * @param {element} element Existing element of DOM
 * @param {String} css name of style property
 */
function extractColor(element, css) {
    let _element = element;
    let style;
    do {
        style = _element.style[css];
        if (style && style !== '' && style !== 'transparent') {
            return style.toLowerCase();
        }
        _element = _element.parentNode;
    } while (_element && _element.tagName !== 'body');
    // catch Safari's way of signalling transparent
    if (style && style === 'rgba(0, 0, 0, 0)') {
        return 'transparent';
    }
    return 'transparent';
}

/**
 * vanilla implementation of jQuery width Fn
 * @param {element} element Existing element of DOM
 */
function getWidth(element) {
    return parseInt(window.getComputedStyle(element).width, 10);
}

/**
 * vanilla implementation of jQuery height Fn
 * @param {element} element Existing element of DOM
 */
function getHeight(element) {
    return parseInt(window.getComputedStyle(element).height, 10);
}

/**
 * vanilla implementation of jQuery outerWidth Fn
 * @param {element} element Existing element of DOM
 * @param {Boolean} withMargin include margin
 */
function outerWidth(element, withMargin = false) {
    let width = element.offsetWidth;
    if (withMargin) {
        const style = window.getComputedStyle(element);
        width += parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);
    }
    return width;
}

/**
 * vanilla implementation of jQuery outerHeight Fn
 * @param {element} element Existing element of DOM
 * @param {Boolean} withMargin include margin
 */
function outerHeight(element, withMargin = false) {
    let height = element.offsetHeight;
    if (withMargin) {
        const style = window.getComputedStyle(element);
        height += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);
    }
    return height;
}

/**
 * vanilla implementation of jQuery hide Fn
 * @param {element} element Existing element of DOM
 */
function hide(element) {
    element.style.display = 'none';
}

/**
 * vanilla implementation of jQuery show Fn
 * @param {element} element Existing element of DOM
 */
function show(element) {
    element.style.display = 'block';
}

function noop() {}

export {
    getChildren,
    getStyle,
    setStyle,
    appendTo,
    prependTo,
    noop,
    detach,
    addClass,
    removeClass,
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
    outerHeight,
    outerWidth,
    hide,
    show,
};
