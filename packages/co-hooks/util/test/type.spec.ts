/**
 * @file type.spec
 */

import {type} from '..';

describe('util.type检测', () => {

    it('null', () => {
        expect(type(null)).toBe('null');
    });

    it('undefined', () => {
        expect(type(undefined)).toBe('undefined');
    });

    it('Boolean', () => {
        const MyBoolean = Boolean;
        expect(type(true)).toBe('boolean');
        expect(type(false)).toBe('boolean');
        expect(type(Boolean(true))).toBe('boolean');
        expect(type(new MyBoolean(true))).toBe('boolean');
    });

    it('Number', () => {
        const MyNumber = Number;
        expect(type(0)).toBe('number');
        expect(type(1)).toBe('number');
        expect(type(Number(1))).toBe('number');
        expect(type(new MyNumber(1))).toBe('number');
    });

    it('String', () => {
        const MyString = String;
        expect(type('')).toBe('string');
        expect(type('a')).toBe('string');
        expect(type(String('a'))).toBe('string');
        expect(type(new MyString('a'))).toBe('string');
    });

    it('Object', () => {
        const MyObject = Object;
        expect(type({})).toBe('object');
        expect(type(new MyObject())).toBe('object');
    });

    it('RegExp', () => {
        expect(type(/foo/)).toBe('regexp');
        expect(type(new RegExp('asdf'))).toBe('regexp');
    });

    it('Array', () => {
        expect(type([1])).toBe('array');
    });

    it('Date', () => {
        expect(type(new Date())).toBe('date');
    });

    it('Function', () => {
        expect(type(new Function('return;'))).toBe('function');
        expect(type(() => null)).toBe('function');
    });

    it('Error', () => {
        expect(type(new Error())).toBe('error');
    });
});
