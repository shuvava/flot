/* globals describe it assert */
import $ from 'jquery';
import { appendTo, setStyle, getChildren, detach, addClass, insertAfter, clone, extend, offset, data, removeData } from '../src/flot-fn-jquery';

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
    describe('#getChildren()', () => {
        it('should have children', () => {
            const id = `${_module_}-getChildren`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            appendTo(elm, $('<div></div>'));
            const children = getChildren(elm, 'div');
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.childNodes.length, children.length);
        });
    });
    describe('#detach()', () => {
        it('should not have children elements', () => {
            const id = `${_module_}-detach`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            const elm2 = $('<div></div>');
            appendTo(elm, elm2);
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.childNodes.length, 1);
            detach(elm2);
            assert.equal(elmDOM.childNodes.length, 0);
        });
    });
    describe('#addClass()', () => {
        it('should not have css class', () => {
            const id = `${_module_}-addClass`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            const cssClassName = 'test-class';
            addClass(elm, cssClassName);
            const elmDOM = document.getElementById(id);
            assert.isTrue(elmDOM.classList.contains(cssClassName));
        });
    });
    describe('#insertAfter()', () => {
        it('should not be the last', () => {
            const id = `${_module_}-insertAfter`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            const elm2 = $('<div></div>');
            appendTo(elm, elm2);
            const elm3 = $('<div id="id1"></div>');
            insertAfter(elm2, elm3);
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.lastChild.id, 'id1');
        });
    });
    describe('#clone()', () => {
        it('should not change id prop', () => {
            const id = `${_module_}-clone`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            const elm2 = $('<div id="test"></div>');
            appendTo(elm, elm2);
            const elm3 = clone(elm2);
            elm3.attr('id', 'dvDemoNew');
            assert.equal(elm2.attr('id'), 'test');
        });
    });
    describe('#extend()', () => {
        it('should copy prop', () => {
            const obj = extend(true, {}, { t: true }, { obj: { a: 1, b: 2 } }, { obj: { b: 3 }, c: false });
            assert.equal(obj.t, true);
            assert.equal(obj.obj.a, 1);
            assert.equal(obj.obj.b, 3);
            assert.equal(obj.c, false);
        });
        it('should copy prop but not deep', () => {
            const obj = extend({}, { t: true }, { obj: { a: 1, b: 2 } }, { obj: { b: 3 }, c: false });
            assert.equal(obj.t, true);
            assert.isUndefined(obj.obj.a);
            assert.equal(obj.obj.b, 3);
            assert.equal(obj.c, false);
        });
    });
    describe('#offset()', () => {
        it('should return data', () => {
            const id = `${_module_}-offset`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            const _offset = offset(elm);
            const _offsetBody = offset(body);
            assert.deepEqual(_offset, _offsetBody);
        });
    });
    describe('#data()', () => {
        it('should return data', () => {
            const id = `${_module_}-data`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            const propID = 'ttt';
            data(elm, propID, { a: 1 });
            const prop = data(elm, propID);
            assert.isDefined(prop);
            assert.equal(prop.a, 1);
        });
    });
    describe('#removeData()', () => {
        it('should return data', () => {
            const id = `${_module_}-removeData`;
            const body = $('body');
            const elm = $(`<div id="${id}"></div>`);
            appendTo(body, elm);
            const propID = 'ttt';
            data(elm, propID, { a: 1 });
            let prop = data(elm, propID);
            assert.isDefined(prop);
            removeData(elm, propID);
            prop = data(elm, propID);
            assert.isUndefined(prop);
        });
    });
});
