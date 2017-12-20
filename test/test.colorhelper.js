/* globals describe it */
const assert = require('assert');
const ColorHelper = require('../src/colorhelper');

describe('ColorHelper', () => {
    describe('#ctor', () => {
        it('class should be define', () => {
            assert.ok(ColorHelper != null);
        });
    });
    describe('#Add()', () => {
        it('should add 1 to g', () => {
            const t = new ColorHelper(1, 1, 1, 1);
            t.add('bg', 1);
            assert.equal(t.g, 2);
        });
    });
});
