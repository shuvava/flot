/**
 * The Canvas object is a wrapper around an HTML5 <canvas> tag.
 */
import { hasOwnProperty } from './flot-fn';
import { noop } from './flot-fn-vanilla';
import { getChildren, setStyle, appendTo, detach, addClass, insertAfter, clone } from './flot-fn-jquery';

// TODO: [VS] switch to vanilla implementation
noop();

const __textContainerClass__ = 'flot-text';
const __textContainerStyle__ = Object.freeze({
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
});

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

        if (element == null) {
            element = document.createElement('canvas');
            element.className = cls;
            setStyle(element, {
                direction: 'ltr', position: 'absolute', left: 0, top: 0,
            });
            appendTo(container, element);

            // If HTML5 Canvas isn't available, fall back to [Ex|Flash]canvas
            if (!element.getContext) {
                if (window.G_vmlCanvasManager) {
                    element = window.G_vmlCanvasManager.initElement(element);
                } else {
                    throw new Error('Canvas is not available. If you\'re using IE with a fall-back such as Excanvas, then there\'s either a mistake in your conditional include, or the page has no DOCTYPE and is rendering in Quirks Mode.'); // eslint-disable-line max-len
                }
            }
        }
        this.element = element;
        this.context = element.getContext('2d');
        this.width = 0;
        this.height = 0;
        // Determine the screen's ratio of physical to device-independent
        // pixels.  This is the ratio between the canvas width that the browser
        // advertises and the number of pixels actually present in that space.

        // The iPhone 4, for example, has a device-independent width of 320px,
        // but its screen is actually 640px wide.  It therefore has a pixel
        // ratio of 2, while most normal devices have a ratio of 1.
        const devicePixelRatio = window.devicePixelRatio || 1;
        const backingStoreRatio = this.context.webkitBackingStorePixelRatio ||
            this.context.mozBackingStorePixelRatio ||
            this.context.msBackingStorePixelRatio ||
            this.context.oBackingStorePixelRatio ||
            this.context.backingStorePixelRatio || 1;
        this.pixelRatio = devicePixelRatio / backingStoreRatio;

        // Size the canvas to match the internal dimensions of its container
        this.resize(container.width(), container.height());

        // Collection of HTML div layers for text overlaid onto the canvas
        this.textContainer = null;
        this.text = {};

        // Cache of text fragments and metrics, so we can avoid expensively
        // re-calculating them when the plot is re-rendered in a loop.
        this._textCache = {};
    }
    /**
     * Resizes the canvas to the given dimensions.
     * @param {number} width New width of the canvas, in pixels.
     * @param {number} height width New height of the canvas, in pixels.
     */
    resize(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error(`Invalid dimensions for plot, width = ${width}, height = ${height}`);
        }
        const { element, context, pixelRatio } = this;

        // Resize the canvas, increasing its density based on the display's
        // pixel ratio; basically giving it more pixels without increasing the
        // size of its element, to take advantage of the fact that retina
        // displays have that many more pixels in the same advertised space.

        // Resizing should reset the state (excanvas seems to be buggy though)
        if (this.width !== width) {
            element.width = width * pixelRatio;
            element.style.width = `${width}px`;
            this.width = width;
        }

        if (this.height !== height) {
            element.height = height * pixelRatio;
            element.style.height = `${height}px`;
            this.height = height;
        }
        // Save the context, so we can reset in case we get replotted.  The
        // restore ensure that we're really back at the initial state, and
        // should be safe even if we haven't saved the initial state yet.

        context.restore();
        context.save();

        // Scale the coordinate space to match the display density; so even though we
        // may have twice as many pixels, we still want lines and other drawing to
        // appear at the same size; the extra pixels will just make them crisper.

        context.scale(pixelRatio, pixelRatio);
    }
    /**
     * Clears the entire canvas area, not including any overlaid HTML text
     */
    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }
    /**
     * Finishes rendering the canvas, including managing the text overlay.
     */
    render() {
        const cache = this._textCache;
        // For each text layer, add elements marked as active that haven't
        // already been rendered, and remove those that are no longer active.
        for (const layerKey in cache) { // eslint-disable-line no-restricted-syntax
            if (hasOwnProperty.call(cache, layerKey)) {
                const layer = this.getTextLayer(layerKey);
                const layerCache = cache[layerKey];

                layer.hide();

                for (const styleKey in layerCache) { // eslint-disable-line no-restricted-syntax
                    if (hasOwnProperty.call(layerCache, styleKey)) {
                        const styleCache = layerCache[styleKey];
                        for (const key in styleCache) { // eslint-disable-line no-restricted-syntax
                            if (hasOwnProperty.call(styleCache, key)) {
                                const { positions } = styleCache[key];

                                // FIXME: [VS] refactor it
                                for (let i = 0, position; position = positions[i]; i++) { // eslint-disable-line
                                    // const position = positions[i];
                                    if (position.active) {
                                        if (!position.rendered) {
                                            appendTo(layer, position.element);
                                            position.rendered = true;
                                        }
                                    } else {
                                        // FIXME: [VS] refactor it
                                        positions.splice(i--, 1);// eslint-disable-line
                                        if (position.rendered) {
                                            detach(position.element);
                                        }
                                    }
                                }

                                if (positions.length === 0) {
                                    delete styleCache[key];
                                }
                            }
                        }
                    }
                }

                layer.show();
            }
        }
    }
    /**
     * Creates (if necessary) and returns the text overlay container.
     * @param {string} classes classes String of space-separated CSS classes used to  uniquely identify the text layer.
     * @returns {object} The jQuery-wrapped text-layer div.
     */
    getTextLayer(classes) {
        // Create the text layer if it doesn't exist
        if (this.text[classes] !== null) {
            return this.text[classes];
        }

        // Create the text layer container, if it doesn't exist
        if (this.textContainer === null) {
            this.textContainer = document.createElement('div');
            addClass(this.textContainer, __textContainerClass__);
            setStyle(this.textContainer, __textContainerStyle__);
            setStyle(this.textContainer, {
                'font-size': 'smaller',
                color: '#545454',
            });
            insertAfter(this.element, this.textContainer);
        }

        const layer = document.createElement('div');
        addClass(this.textContainer, classes);
        setStyle(this.textContainer, __textContainerStyle__);
        appendTo(this.textContainer, layer);
        this.text[classes] = layer;

        return layer;
    }
    /**
     * Creates (if necessary) and returns a text info object.
     * The object looks like this:
     * {
     *     width: Width of the text's wrapper div.
     *     height: Height of the text's wrapper div.
     *     element: The jQuery-wrapped HTML div containing the text.
     *     positions: Array of positions at which this text is drawn.
     * }
     *
     * The positions array contains objects that look like this:
     *
     * {
     *     active: Flag indicating whether the text should be visible.
     *     rendered: Flag indicating whether the text is currently visible.
     *     element: The jQuery-wrapped HTML div containing the text.
     *     x: X coordinate at which to draw the text.
     *     y: Y coordinate at which to draw the text.
     * }
     *
     * Each position after the first receives a clone of the original element.
     * The idea is that that the width, height, and general 'identity' of the
     * text is constant no matter where it is placed; the placements are a
     * secondary property.
     *
     * Canvas maintains a cache of recently-used text info objects; getTextInfo
     * either returns the cached element or creates a new entry.
     *
     * @param {string} layer A string of space-separated CSS classes uniquely
     *      identifying the layer containing this text.
     * @param {string} text Text string to retrieve info for.
     * @param {(string|object)=} font Either a string of space-separated CSS
     *     classes or a font-spec object, defining the text's font and style.
     * @param {number=} angle Angle at which to rotate the text, in degrees.
     *     Angle is currently unused, it will be implemented in the future.
     * @param {number=} width Maximum width of the text before it wraps.
     * @return {object} a text info object.
     */
    getTextInfo(layer, text, font, angle, width) {
        // Cast the value to a string, in case we were given a number or such
        text = text.toString();

        // If the font is a font-spec object, generate a CSS font definition
        let textStyle;
        if (typeof font === 'object') {
            textStyle = `${font.style} ${font.variant} ${font.weight} ${font.size}px/${font.lineHeight}px ${font.family}`;
        } else {
            textStyle = font;
        }

        // Retrieve (or create) the cache for the text's layer and styles
        if (this._textCache[layer] == null) {
            this._textCache[layer] = {};
        }
        const layerCache = this._textCache[layer];
        if (layerCache[textStyle] == null) {
            layerCache[textStyle] = {};
        }
        const styleCache = layerCache[textStyle];

        // If we can't find a matching element in our cache, create a new one
        if (styleCache[text] == null) {
            const element = document.createElement('div');
            setStyle(element, {
                position: 'absolute',
                'max-width': width,
                top: -9999,
            });
            appendTo(this.getTextLayer(layer), element);
            if (typeof font === 'object') {
                setStyle(element, {
                    font: textStyle,
                    color: font.color,
                });
            } else if (typeof font === 'string') {
                addClass(element, font);
            }

            styleCache[text] = {
                width: element.outerWidth(true),
                height: element.outerHeight(true),
                element: element,
                positions: [],
            };
        }

        return styleCache[text];
    }
    /**
     * Adds a text string to the canvas text overlay.
     *
     * The text isn't drawn immediately; it is marked as rendering, which will
     * result in its addition to the canvas on the next render pass.
     *
     * @param {string} layer A string of space-separated CSS classes uniquely
     *     identifying the layer containing this text.
     * @param {number} x X coordinate at which to draw the text.
     * @param {number} y Y coordinate at which to draw the text.
     * @param {string} text Text string to draw.
     * @param {(string|object)=} font Either a string of space-separated CSS
     *     classes or a font-spec object, defining the text's font and style.
     * @param {number=} angle Angle at which to rotate the text, in degrees.
     *     Angle is currently unused, it will be implemented in the future.
     * @param {number=} width Maximum width of the text before it wraps.
     * @param {string=} halign Horizontal alignment of the text;
     *      either "left", "center" or "right".
     * @param {string=} valign Vertical alignment of the text;
     *      either "top", "middle" or "bottom".
     */
    addText(layer, x, y, text, font, angle, width, halign, valign) {
        const info = this.getTextInfo(layer, text, font, angle, width);
        const { positions } = info;

        // Tweak the div's position to match the text's alignment
        if (halign === 'center') {
            x -= info.width / 2;
        } else if (halign === 'right') {
            x -= info.width;
        }

        if (valign === 'middle') {
            y -= info.height / 2;
        } else if (valign === 'bottom') {
            y -= info.height;
        }

        // Determine whether this text already exists at this position.
        // If so, mark it for inclusion in the next render pass.
        for (let i = 0; i < positions.length; i += 1) {
            const position = positions[i];
            if (position.x === x && position.y === y) {
                position.active = true;
                return;
            }
        }

        // If the text doesn't exist at this position, create a new entry
        // For the very first position we'll re-use the original element,
        // while for subsequent ones we'll clone it.
        const position = {
            active: true,
            rendered: false,
            element: positions.length ? clone(info.element) : info.element,
            x: x,
            y: y,
        };

        positions.push(position);
        // Move the element to its final position within the container
        setStyle(position.element, {
            top: Math.round(y),
            left: Math.round(x),
            'text-align': halign, // In case the text wraps
        });
    }
    /**
     * Removes one or more text strings from the canvas text overlay.
     *
     * If no parameters are given, all text within the layer is removed.
     *
     * Note that the text is not immediately removed; it is simply marked as
     * inactive, which will result in its removal on the next render pass.
     * This avoids the performance penalty for 'clear and redraw' behavior,
     * where we potentially get rid of all text on a layer, but will likely
     * add back most or all of it later, as when redrawing axes, for example.
     *
     * @param {string} layer A string of space-separated CSS classes uniquely
     *     identifying the layer containing this text.
     * @param {number=} x X coordinate of the text.
     * @param {number=} y Y coordinate of the text.
     * @param {string=} text Text string to remove.
     * @param {(string|object)=} font Either a string of space-separated CSS
     *     classes or a font-spec object, defining the text's font and style.
     * @param {number=} angle Angle at which the text is rotated, in degrees.
     *     Angle is currently unused, it will be implemented in the future.
     */
    removeText(layer, x, y, text, font, angle) {
        if (text == null) {
            const layerCache = this._textCache[layer];
            if (layerCache == null) {
                return;
            }
            for (const styleKey in layerCache) { // eslint-disable-line no-restricted-syntax
                if (hasOwnProperty.call(layerCache, styleKey)) {
                    const styleCache = layerCache[styleKey];
                    for (const key in styleCache) { // eslint-disable-line no-restricted-syntax
                        if (hasOwnProperty.call(styleCache, key)) {
                            const { positions } = styleCache[key];
                            for (let i = 0; i < positions.length; i += 1) {
                                positions[i].active = false;
                            }
                        }
                    }
                }
            }
            return;
        }
        const { positions } = this.getTextInfo(layer, text, font, angle);
        for (let i = 0; i < positions.length; i += 1) {
            const position = positions[i];
            if (position.x === x && position.y === y) {
                position.active = false;
            }
        }
    }
}
