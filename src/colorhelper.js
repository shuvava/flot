function clamp(value, min = 0, max = 255) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

export default class ColorHelper {
    constructor(r, g, b, a) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a || 0;
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
        return new ColorHelper(this.r, this.g, this.b, this.a);
    }
}

