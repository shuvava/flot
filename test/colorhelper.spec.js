/* globals assert */
import ColorHelper from '../src/colorhelper';

describe('ColorHelper', () => {
    describe('#ctor', () => {
        it('class should be define', () => {
            assert.ok(ColorHelper != null);
        });
    });
    describe('#Add()', () => {
        it('should add 1 to g', () => {
            const t = new ColorHelper({
                r: 1, g: 1, b: 1, a: 1,
            });
            t.add('bg', 1);
            assert.equal(t.g, 2);
        });
    });
});
