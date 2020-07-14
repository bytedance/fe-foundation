/**
 * @file keyMirror.spec 测试key mirror函数
 */

import {keyMirror} from '../src';

describe('util.keyMirror', () => {

    it('key mirror with char string', () => {

        expect(keyMirror('abc')).toEqual({
            a: 'a',
            b: 'b',
            c: 'c'
        });

        expect(keyMirror('\n')).toEqual({
            '\n': '\n'
        });

        expect(keyMirror('a')).toEqual({
            a: 'a'
        });
    });

    it('key mirror with split string', () => {

        expect(keyMirror('foo bar', ' ')).toEqual({
            foo: 'foo',
            bar: 'bar'
        });

        expect(keyMirror('ab\n', ' ')).toEqual({
            'ab\n': 'ab\n'
        });

        expect(keyMirror('foo', ' ')).toEqual({
            foo: 'foo'
        });
    });

    it('key mirror with array', () => {

        expect(keyMirror(['foo', 'bar'], ' ')).toEqual({
            foo: 'foo',
            bar: 'bar'
        });

        expect(keyMirror(['ab\n'], ' ')).toEqual({
            'ab\n': 'ab\n'
        });

        expect(keyMirror(['foo'], ' ')).toEqual({
            foo: 'foo'
        });
    });

    it('key mirror with number', () => {

        expect(keyMirror(123, ' ')).toEqual({
            123: '123'
        });

        expect(keyMirror([123, 'foo'], ' ')).toEqual({
            123: '123',
            foo: 'foo'
        });

        expect(keyMirror([0], ' ')).toEqual({
            0: '0'
        });
    });
});
