/* globals describe it */
const { assert } = require('chai');
const $ = require('../bak/jquery');

describe('jQuery', () => {
    describe('#getDocumentRoot()', () => {
        it('should be not null', () => {
            const body = $('body');
            assert.equal(body.length, 1);
        });
    });
});
