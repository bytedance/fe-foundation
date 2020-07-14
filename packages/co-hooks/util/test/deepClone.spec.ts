/**
 * @file clone.spec
 */

import {deepClone as clone} from '..';

describe('util.deepClone检测', () => {

    it('值类型克隆应当相同', () => {
        expect(clone(null)).toBeNull();
        expect(clone(undefined)).toBeUndefined();
        expect(clone(1)).toBe(1);
        expect(clone(NaN)).toBeNaN();
        expect(clone(Infinity)).toBe(Infinity);
        expect(clone(true)).toBe(true);
        expect(clone(false)).toBe(false);
        expect(clone('')).toBe('');
        expect(clone('foo')).toBe('foo');
    });

    it('包装类型应当可以被复制', () => {
        /* tslint:disable*/
        // noinspection JSPrimitiveTypeWrapperUsage
        expect(clone(new Number(1))).toBe(1);
        // noinspection JSPrimitiveTypeWrapperUsage
        expect(clone(new String('foo'))).toBe('foo');
        // noinspection JSPrimitiveTypeWrapperUsage
        expect(clone(new Boolean(false))).toBe(false);
        /* tslint:enable*/
    });

    it('包装类型应当去对象化', () => {
        /* tslint:disable*/
        // noinspection JSPrimitiveTypeWrapperUsage
        expect(typeof clone(new Number(1))).toBe('number');
        // noinspection JSPrimitiveTypeWrapperUsage
        expect(typeof clone(new String('foo'))).toBe('string');
        // noinspection JSPrimitiveTypeWrapperUsage
        expect(typeof clone(new Boolean(false))).toBe('boolean');
        /* tslint:enable*/
    });

    it('正则表达式应当返回对象本身', () => {
        const reg = /foo/;
        expect(clone(reg)).toBe(reg);
    });

    it('日期应当产生副本', () => {
        const date = new Date();

        expect(clone(date)).not.toBe(date);
        expect(+clone(date)).toBe(+date);
    });

    it('异常对象应当还是异常对象', () => {
        const error = new Error('foo');
        expect(Object.prototype.toString.call(clone(error))).toBe('[object Error]');
        expect(clone(error)).toEqual(error);
    });

    it('数组应当会被正确复制', () => {
        const arr = [1, 2, 3, 4, 5];

        expect(clone(arr)).not.toBe(arr);
        expect('' + clone(arr)).toBe('' + arr);
    });

    it('对象应当被正确复制', () => {

        const obj = {
            foo: 'bar',
            empty: undefined
        };

        expect(clone(obj)).toEqual(obj);

        // 对于现代浏览器使用Object.keys检测克隆顺序
        if (Object.keys) {
            expect(Object.keys(clone(obj))).toEqual(Object.keys(obj));
        }
    });

    it('深拷贝测试', () => {

        const obj = {
            foo: [1, 2, 3],
            bar: {
                baz: 4
            }
        };

        expect(clone(obj)).toEqual(obj);
    });

    it('测试稀疏数组', () => {

        // noinspection JSConsecutiveCommasInArrayLiteral
        const obj = [1, , 2];

        expect(clone(obj)).toEqual(obj);
        expect(Object.keys(obj).length).toBe(2);
    });
});
