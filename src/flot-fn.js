/**
 * common function implementation
 * uses to create abstraction layer from external libraries
 */

// Cache the prototype hasOwnProperty for faster access
const { hasOwnProperty } = Object.prototype;

/**
 * operation produces the same effect as detach, i.e. removing the element
 */
function detach(elements) {
    for (let i = 0; i < elements.length; i += 1) {
        if (elements[i].parentNode) {
            elements[i].parentNode.removeChild(elements[i]);
        }
    }
}

export {
    detach,
    hasOwnProperty,
};
