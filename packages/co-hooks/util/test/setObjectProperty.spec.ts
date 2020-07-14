/**
 * @file setObjectProperty.spec
 */

import {setObjectProperty} from '../src';

describe('setObjectProperty函数测试', () => {

    it('一级参数数组测试', () => {
        const obj = {foo: 'bar'};

        const ret = setObjectProperty(obj, 'baz', ['foo']);

        expect(ret).toBe(true);
        expect(obj.foo).toBe('baz');
    });

    it('多级参数数组测试', () => {

        const obj = {
            foo: {
                bar: 'bar'
            }
        };

        const ret = setObjectProperty(obj, 'baz', ['foo', 'bar']);

        expect(ret).toBe(true);
        expect(obj.foo.bar).toBe('baz');
    });

    it('数组测试', () => {

        const obj = {
            foo: [1, 2, 3]
        };

        const ret = setObjectProperty(obj, 'baz', ['foo', '1']);

        expect(ret).toBe(true);
        expect(obj.foo[1]).toBe('baz');
    });

    it('顺序参数测试', () => {

        const obj = {
            foo: {
                bar: 'bar'
            }
        };

        const ret = setObjectProperty(obj, 'baz', ['nonexist', 'foo', 'bar'], 1);

        expect(ret).toBe(true);
        expect(obj.foo.bar).toBe('baz');
    });

    it('bad case 1', () => {

        const obj = {
            foo: {
                bar: 'bar'
            }
        };

        const ret = setObjectProperty(obj, 'baz', ['nonexist', 'foo', 'baz']);

        expect(ret).toBe(false);
        expect(obj).toEqual({
            foo: {
                bar: 'bar'
            }
        });
    });

    it('bad case 2', () => {

        const ret = setObjectProperty(null, 'baz', ['foo', 'baz']);

        expect(ret).toBe(false);
    });

    it('bad case 3', () => {

        const ret = setObjectProperty('', 'baz', ['foo', 'baz']);

        expect(ret).toBe(false);
    });
});
