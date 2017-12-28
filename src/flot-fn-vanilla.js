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

/**
 * vanilla implementation of jQuery css Fn
 * @param {element} element Element of DOM
 * @param {string} style css property name
 */
function getStyle(element, style) {
    return element.style[style];
}

/**
 * vanilla implementation of jQuery appendTo Fn
 * @param {element} root Element of DOM
 * @param {element} element Element of DOM
 */
function appendTo(root, element) {
    root.appendChild(element);
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
function data(element, id, obj) {
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

function noop() {}

export {
    getChildren,
    getStyle,
    setStyle,
    appendTo,
    noop,
    detach,
    addClass,
    removeClass,
    insertAfter,
    clone,
    extend,
    offset,
    data,
    removeData,
    empty,
};
