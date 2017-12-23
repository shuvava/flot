/* globals describe it assert */
// import { assert } from 'chai';
import $ from 'jquery';
import { appendTo, setStyle } from '../src/flot-fn-jquery';

const _module_ = 'flot-fn-jquery';

describe('flot-fn-jquery', () => {
    describe('#appendTo()', () => {
        it('should be not null', () => {
            const id = `${_module_}-appendTo`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            const elms = document.getElementById(id);
            assert.isNotNull(elms.length);
        });
    });
    describe('#setStyle()', () => {
        it('should have style', () => {
            const id = `${_module_}-setStyle`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            setStyle(elm, { position: 'absolute' });
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.style.position, 'absolute');
        });
    });
});
