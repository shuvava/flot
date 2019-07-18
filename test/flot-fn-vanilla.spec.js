/* globals assert expect */
import {
    appendTo, setStyle, getChildren,
    detach, addClass, insertAfter, clone,
    extend, offset, domData, removeData,
    empty, html, remove,
    trigger, once,
} from '../src/flot-fn-vanilla';


const _module_ = 'flot-fn-vanilla';

describe(_module_, () => {
    describe('#appendTo()', () => {
        it('should be not null', () => {
            const id = `${_module_}-appendTo`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const elms = document.getElementById(id);
            assert.isNotNull(elms.length);
        });
    });

    describe('#setStyle()', () => {
        it('should have style', () => {
            const id = `${_module_}-setStyle`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            setStyle(elm, { position: 'absolute' });
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.style.position, 'absolute');
        });
    });

    describe('#getChildren()', () => {
        const id = `${_module_}-getChildren`;
        const body = document.getElementsByTagName('body')[0];
        const elm = document.createElement('div');
        elm.setAttribute('id', id);
        appendTo(body, elm);
        appendTo(elm, document.createElement('div'));
        appendTo(elm, document.createElement('span'));
        it('should have children', () => {
            const children = getChildren(elm);
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.childNodes.length, children.length);
        });
        it('should have children', () => {
            const children = getChildren(elm, '');
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.childNodes.length, children.length);
        });
        it('should have one child', () => {
            const children = getChildren(elm, 'div');
            assert.equal(1, children.length);
        });
    });

    describe('#detach()', () => {
        it('should not have child element', () => {
            const id = `${_module_}-detach1`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const elm2 = document.createElement('div');
            appendTo(elm, elm2);
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.childNodes.length, 1);
            detach(elm2);
            assert.equal(elmDOM.childNodes.length, 0);
        });
        it('should not have children elements', () => {
            const id = `${_module_}-detach2`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            appendTo(elm, document.createElement('div'));
            appendTo(elm, document.createElement('div'));
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.childNodes.length, 2);
            const arr = elm.getElementsByTagName('div');
            detach(arr);
            assert.equal(elmDOM.childNodes.length, 0);
        });
    });

    describe('#addClass()', () => {
        it('should not have css class', () => {
            const id = `${_module_}-addClass01`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const cssClassName = 'test-class';
            addClass(elm, cssClassName);
            const elmDOM = document.getElementById(id);
            assert.isTrue(elmDOM.classList.contains(cssClassName));
        });
        it('should not have two css classes', () => {
            const id = `${_module_}-addClass02`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const cssClassName = 'test-class test-cls test-cls';
            addClass(elm, cssClassName);
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.classList.length, 2);
        });
    });

    describe('#insertAfter()', () => {
        it('should not be the last', () => {
            const id = `${_module_}-insertAfter`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const elm2 = document.createElement('div');
            appendTo(elm, elm2);
            const elm3 = document.createElement('div');
            elm3.setAttribute('id', 'id1');
            insertAfter(elm2, elm3);
            const elmDOM = document.getElementById(id);
            assert.equal(elmDOM.lastChild.id, 'id1');
        });
    });

    describe('#clone()', () => {
        it('should not change id prop', () => {
            const id = `${_module_}-clone`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const elm2 = document.createElement('div');
            elm2.setAttribute('id', 'test');
            appendTo(elm, elm2);
            const elm3 = clone(elm2);
            elm3.setAttribute('id', 'dvDemoNew');
            assert.equal(elm2.getAttribute('id'), 'test');
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
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const _offset = offset(elm);
            const _offsetBody = offset(body);
            assert.deepEqual(_offset.left, _offsetBody.left);
        });
    });

    describe('#data()', () => {
        it('should store data', () => {
            const id = `${_module_}-data`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const propID = 'ttt';
            domData(elm, propID, { a: 1 });
            const prop = domData(elm, propID);
            assert.isDefined(prop);
            assert.equal(prop.a, 1);
        });
    });

    describe('#removeData()', () => {
        it('should remove data', () => {
            const id = `${_module_}-removeData`;
            const body = document.getElementsByTagName('body')[0];
            const elm = document.createElement('div');
            elm.setAttribute('id', id);
            appendTo(body, elm);
            const propID = 'ttt';
            domData(elm, propID, { a: 1 });
            let prop = domData(elm, propID);
            assert.isDefined(prop);
            removeData(elm, propID);
            prop = domData(elm, propID);
            assert.isUndefined(prop);
        });
    });
    describe('#empty()', () => {
        const id = `${_module_}-empty`;
        const body = document.getElementsByTagName('body')[0];
        const elm = document.createElement('div');
        elm.setAttribute('id', id);
        elm.innerText = 'test';
        appendTo(body, elm);
        it('should be not empty', () => {
            const text = elm.innerText;
            expect(text).to.not.be.empty; // eslint-disable-line no-unused-expressions
        });
        it('should be empty', () => {
            empty(elm);
            const text = elm.innerText;
            expect(text).to.be.empty; // eslint-disable-line no-unused-expressions
        });
    });
    describe('#html', () => {
        const id = `${_module_}-html`;
        const body = document.getElementsByTagName('body')[0];
        const elm = document.createElement('div');
        elm.setAttribute('id', id);
        appendTo(body, elm);
        it('should be empty', () => {
            const _html = elm.innerHTML;
            expect(_html).to.be.empty; // eslint-disable-line no-unused-expressions
        });
        it('should be not empty', () => {
            html(elm, '<div>test</div>');
            const _html = elm.innerHTML;
            expect(_html).to.not.be.empty; // eslint-disable-line no-unused-expressions
        });
    });
    describe('#remove', () => {
        const id = `${_module_}-remove`;
        const body = document.getElementsByTagName('body')[0];
        const testClass = 'test-remove-css';
        const elm = document.createElement('div');
        elm.setAttribute('id', id);
        elm.innerHTML = `<div class="${testClass}">vvv</div><div class="${testClass}">xxx</div>`;
        appendTo(body, elm);
        it('should has children', () => {
            const cnt = getChildren(elm, `.${testClass}`).length;
            assert.isTrue(cnt > 0);
        });
        it('should has no children', () => {
            remove(elm, `.${testClass}`);
            const cnt = getChildren(elm, `.${testClass}`).length;
            assert.isTrue(cnt === 0);
        });
    });

    describe('#trigger', () => {
        const id = `${_module_}-trigger`;
        const body = document.getElementsByTagName('body')[0];
        const testClass = 'test-trigger';
        const elm = document.createElement('form');
        elm.setAttribute('id', id);
        elm.innerHTML = `<div class="${testClass}-1">${id}</div>`;
        appendTo(body, elm);
        it('should has call subscribed on event observer', (done) => {
            elm.addEventListener('click', (evt) => {
                evt.preventDefault();
                done();
            }, false);
            trigger(elm, 'click');
        });
        it('should pass custom args into event observer', (done) => {
            elm.addEventListener('click1', (evt) => {
                const args = evt.detail;
                assert.isArray(args);
                assert.isTrue(args.length === 2);
                assert.sameMembers(args, [1, 'true']);
                evt.preventDefault();
                done();
            }, false);
            trigger(elm, 'click1', [1, 'true']);
            setTimeout(() => done(), 1000);
        });
    });

    describe('#one', () => {
        const id = `${_module_}-one`;
        const body = document.getElementsByTagName('body')[0];
        const testClass = 'test-one';
        const elm = document.createElement('form');
        elm.setAttribute('id', id);
        elm.innerHTML = `<div class="${testClass}-1">${id}</div>`;
        appendTo(body, elm);
        it('should has call subscribed on event observer', (done) => {
            once(elm, 'click', (evt) => {
                evt.preventDefault();
                done();
            });
            trigger(elm, 'click');
        });
    });
});
