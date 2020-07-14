/**
 * @file MemCache.spec 缓存测试
 */

import {MemCache} from '../src';

describe('Cache test', () => {

    it('构造函数', () => {
        const cache: any = new MemCache();
        expect(cache.cache).toEqual({});
    });

    const addTests: any[] = [
        ['null', null, {foo: null}],
        ['undefined', undefined, {foo: undefined}],
        ['string', '1', {foo: '1'}],
        ['number', 1, {foo: 1}],
        ['regexp', /a/, {foo: /a/}],
        ['boolean', false, {foo: false}]
    ];

    it.each(addTests)('添加缓存测试 %s', (_, value, expected) => {
        const cache: any = new MemCache();
        cache.addCache('foo', value);
        expect(cache.cache).toEqual(expected);
    });

    const addCloneTests: any[] = [
        ['object', {bar: {baz: 1}}],
        ['array', [{bar: {baz: 1}}]]
    ];

    it.each(addCloneTests)('克隆测试 %s', (name, value) => {

        const cache: any = new MemCache();

        cache.addCache('foo', value);

        expect(cache.cache.foo).toEqual(value);
        expect(cache.cache.foo).not.toBe(value);
    });

    it('remove all test', () => {

        const cache: any = new MemCache();

        cache.addCache('foo', 1);

        const old = cache.cache;

        const res = cache.removeCache();
        expect(res).toBe(old);
        expect(cache.cache).not.toBe(old);
        expect(cache.cache).toEqual({});
    });

    it('remove item test', () => {

        const cache: any = new MemCache();

        cache.addCache('foo', 1);

        const old = cache.cache;

        const res = cache.removeCache('foo');
        expect(cache.cache).toBe(old);
        expect(res).toBe(1);
        expect(cache.cache).toEqual({});
    });

    it('get all test', () => {

        const cache: any = new MemCache();

        cache.addCache('foo', 1);

        const old = cache.cache;

        const res = cache.getCache();
        expect(res).toEqual(old);
        expect(res).not.toBe(old);
        expect(cache.cache).toEqual({foo: 1});
    });

    it('get item test', () => {

        const cache: any = new MemCache();

        cache.addCache('foo', 1);

        const old = cache.cache;

        const res = cache.getCache('foo');
        expect(cache.cache).toBe(old);
        expect(res).toBe(1);
        expect(cache.cache).toEqual({foo: 1});
    });

    it('get item clone test', () => {

        const cache: any = new MemCache();

        const old = {bar: 1};

        cache.addCache('foo', old);

        for (let i = 0; i < 5; i++) {
            const res = cache.getCache('foo');
            expect(res).toEqual(old);
            expect(res).not.toBe(old);
        }
    });

    it('test hasKey', () => {

        const cache: any = new MemCache();

        const old = {bar: 1};

        cache.addCache('foo', old);

        expect(cache.hasKey('foo')).toBe(true);
    });

    it('test direct', () => {

        const cache: any = new MemCache(true);

        const old = {bar: 1};

        cache.addCache('foo', old);

        for (let i = 0; i < 5; i++) {
            const res = cache.getCache('foo');
            expect(res).toBe(old);
        }
    });
});
