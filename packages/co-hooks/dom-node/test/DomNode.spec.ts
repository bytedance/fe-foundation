/**
 * @file DomNode.spec Dom树测试
 */
import {DomNode} from '../src';

describe('Node.spec', () => {

    it('test new node', () => {

        const node = new DomNode<string>('');

        expect(node.getValue()).toBe('');
        expect(node.parentNode).toBeNull();
        expect(node.lastChild).toBeNull();
        expect(node.firstChild).toBeNull();
        expect(node.leftNode).toBeNull();
        expect(node.rightNode).toBeNull();
    });

    describe('test value', () => {

        it('test get null value', () => {

            const node = new DomNode<string>('foo');

            expect(node.getValue()).toBe('foo');
        });

        it('test get string value', () => {

            const node = new DomNode<string>('');

            node.setValue('foo');

            expect(node.getValue()).toBe('foo');
        });

        it('test get obj value', () => {

            const obj = {foo: 1};
            const node = new DomNode<{}>({});

            node.setValue(obj);

            expect(node.getValue()).toBe(obj);
        });
    });
});
