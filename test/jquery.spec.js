/* globals assert */
import $ from 'jquery';

describe('jQuery', () => {
    describe('#getDocumentRoot()', () => {
        it('should be not null', () => {
            const body = $('body');
            assert.equal(body.length, 1);
        });
    });
});
