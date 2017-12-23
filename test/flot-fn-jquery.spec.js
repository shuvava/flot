/* globals describe it assert */
// import { assert } from 'chai';
import $ from 'jquery';
import { appendTo } from '../src/flot-fn-jquery';

describe('flot-fn-jquery', () => {
    describe('#appendTo()', () => {
        it('should be not null', () => {
            const body = $('body');
            const elm = $('<div id="flot-fn-jquery-appendTo"></div>');
            appendTo(body, elm);
            const elms = document.getElementById('flot-fn-jquery-appendTo');
            assert.isNotNull(elms.length);
        });
    });
});
