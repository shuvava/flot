const lookupColors = {
    aqua: [0, 255, 255],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    black: [0, 0, 0],
    blue: [0, 0, 255],
    brown: [165, 42, 42],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgrey: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkviolet: [148, 0, 211],
    fuchsia: [255, 0, 255],
    gold: [255, 215, 0],
    green: [0, 128, 0],
    indigo: [75, 0, 130],
    khaki: [240, 230, 140],
    lightblue: [173, 216, 230],
    lightcyan: [224, 255, 255],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    navy: [0, 0, 128],
    olive: [128, 128, 0],
    orange: [255, 165, 0],
    pink: [255, 192, 203],
    purple: [128, 0, 128],
    violet: [128, 0, 128],
    red: [255, 0, 0],
    silver: [192, 192, 192],
    white: [255, 255, 255],
    yellow: [255, 255, 0],
};
function clamp(value, min = 0, max = 255) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

function parseColorFromString(str) {
    // Look for rgb(num,num,num)
    let res = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(str);
    if (res) {
        return {
            r: parseInt(res[1], 10),
            g: parseInt(res[2], 10),
            b: parseInt(res[3], 10),
        };
    }
    // Look for rgba(num,num,num,num)
    res = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str);
    if (res) {
        return {
            r: parseInt(res[1], 10),
            g: parseInt(res[2], 10),
            b: parseInt(res[3], 10),
            a: parseInt(res[4], 10),
        };
    }
    // Look for rgb(num%,num%,num%)
    res = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*\)/.exec(str);
    if (res) {
        return {
            r: parseFloat(res[1]) * 2.55,
            g: parseFloat(res[2]) * 2.55,
            b: parseFloat(res[3]) * 2.55,
            a: parseFloat(res[4]),
        };
    }
    // Look for #a0b1c2
    res = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(str);
    if (res) {
        return {
            r: parseInt(res[1], 16),
            g: parseInt(res[2], 16),
            b: parseInt(res[3], 16),
        };
    }
    // Look for #fff
    res = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(str);
    if (res) {
        return {
            r: parseInt(res[1] + res[1], 16),
            g: parseInt(res[2] + res[2], 16),
            b: parseInt(res[3] + res[3], 16),
        };
    }
    // Otherwise, we're most likely dealing with a named color
    const name = str.toString().trim().toLowerCase();
    if (name === 'transparent') {
        return {
            r: 255, g: 255, b: 255, a: 0,
        };
    }
    // default to black
    res = lookupColors[name] || [0, 0, 0];
    return {
        r: res[0], g: res[1], b: res[2],
    };
}

export default class ColorHelper {
    constructor(opts) {
        if (typeof opts === 'string' || opts instanceof String) {
            opts = parseColorFromString(opts);
        }
        const {
            r, g, b, a,
        } = opts;
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a != null ? a : 1;
        this.normalize();
    }

    add(channels, value) {
        for (let i = 0; i < channels.length; i += 1) {
            this[channels.charAt(i)] += value;
        }
        return this.normalize();
    }

    scale(channels, value) {
        for (let i = 0; i <= channels.length; i += 1) {
            this[channels.charAt(i)] *= value;
        }
        return this.normalize();
    }

    normalize() {
        this.r = clamp(parseInt(this.r, 10));
        this.g = clamp(parseInt(this.g, 10));
        this.b = clamp(parseInt(this.b, 10));
        this.a = clamp(this.a, 0, 1);

        return this;
    }

    toString() {
        if (this.a >= 1.0) {
            return `rgb(${this.r},${this.g},${this.b})`;
        }
        return `rgb(${this.r},${this.g},${this.b},${this.a})`;
    }
    clone() {
        return new ColorHelper({
            r: this.r, g: this.g, b: this.b, a: this.a,
        });
    }
}

