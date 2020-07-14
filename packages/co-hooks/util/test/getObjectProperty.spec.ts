/**
 * @file getObjectProperty.spec
 */

import {getObjectProperty} from '../src';

describe('getObjectProperty函数测试', () => {

    it('无参数测试', () => {
        expect(getObjectProperty(undefined)).toBe(null);
        expect(getObjectProperty(null)).toBe(null);
    });

    it('单参数测试', () => {
        const obj = {};
        expect(getObjectProperty(obj)).toEqual(obj);
        expect(getObjectProperty('')).toBe('');
    });

    it('一级参数数组测试', () => {
        const obj = {foo: 'bar'};
        expect(getObjectProperty(obj, ['foo'])).toBe('bar');
        expect(getObjectProperty(obj, ['foo', 'bar'])).toBe(null);
        expect(getObjectProperty(obj, ['bar'])).toBe(null);
    });

    it('多级参数数组测试', () => {

        const obj = {
            foo: {
                bar: 'bar'
            }
        };

        expect(getObjectProperty(obj, ['foo'])).toEqual(obj.foo);
        expect(getObjectProperty(obj, ['foo', 'bar'])).toBe('bar');
        expect(getObjectProperty(obj, ['bar'])).toBe(null);
        expect(getObjectProperty(obj, ['foo', 'bar', 'baz'])).toBe(null);
    });

    it('数组测试', () => {

        const obj = {
            foo: [1, 2, 3]
        };

        expect(getObjectProperty(obj, ['foo', 0])).toBe(1);
        expect(getObjectProperty(obj, ['foo', '0'])).toBe(1);
        expect(getObjectProperty(obj, ['foo', 1])).toBe(2);
        expect(getObjectProperty(obj, ['foo', 'length'])).toBe(3);
    });

    it('顺序参数测试', () => {

        const obj = {
            foo: {
                bar: 'bar'
            }
        };

        expect(getObjectProperty(obj, ['nonexist', 'foo'], 1)).toEqual(obj.foo);
        expect(getObjectProperty(obj, ['nonexist', 'foo', 'bar'], 1)).toBe('bar');
        expect(getObjectProperty(obj, ['nonexist', 'bar'], 1)).toBe(null);
        expect(getObjectProperty(obj, ['nonexist', 'foo', 'bar', 'baz'], 1)).toBe(null);
    });
});
