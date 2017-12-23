/* globals describe it assert */
import { appendTo } from '../src/flot-fn-vanilla';


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
});
