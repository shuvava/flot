/**
 * The Canvas object is a wrapper around an HTML5 <canvas> tag.
 */
import { noop } from './flot-fn-vanilla';
import { getChildren, setStyle } from './flot-fn-jquery';

noop();

export default class Canvas {
    /**
     * @constructor
     * @param {string} cls List of classes to apply to the canvas.
     * @param {element} container Element onto which to append the canvas.
     *
     * Requiring a container is a little iffy, but unfortunately canvas
     * operations don't work unless the canvas is attached to the DOM.
     */
    constructor(cls, container) {
        let element = getChildren(container, `.${cls}`)[0];

        if (element === null) {
            element = document.createElement('canvas');
            element.className = cls;
            setStyle(element, {
                direction: 'ltr', position: 'absolute', left: 0, top: 0,
            });
        }

    }
}
