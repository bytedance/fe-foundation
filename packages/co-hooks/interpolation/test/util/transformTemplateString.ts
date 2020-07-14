/**
 * @file transformTemplateString
 */

import {transformTemplateString} from '../../src';
import conf from './conf.json';

describe('transformTemplateString', () => {

    it('compile', () => {

        const origin = 'aaa${bbb}${ccc()}';
        const options = {
            symbols: [
                {
                    symbol: 'scope',
                    direct: false,
                    level: false
                },
                {
                    symbol: 'hooks',
                    direct: true,
                    level: false
                }
            ],
            default: 'scope',
            call: 'hooks'
        };

        const result = transformTemplateString(origin, options);

        const {
            expr,
            watchers,
            func,
            code
        } = result;

        expect(expr).toBe(origin);
        expect(code).toBe('"aaa" + ($_get_by_any("scope", "bbb")) + ($hooks.ccc())');
        expect(watchers).toEqual(['scope.bbb']);

        const getter = (arg1: string, arg2: string): string => {
            expect(arg1).toBe('scope');
            expect(arg2).toBe('bbb');
            return 'bbb';
        };

        const $hooks = {
            ccc: () => 'ccc'
        };

        expect(func(getter, $hooks)).toBe('aaabbbccc');
    });


    it('test case', () => {

        const origin = '${input.split(\',\').map(item=> + item).reduce((num, item)=> num + item, 0)}';
        const result = transformTemplateString(origin, conf);
        const {
            expr,
            watchers,
            func,
            code
        } = result;

        expect(expr).toBe(origin);
        expect(code).toBe(
            '$_get_by_any("scope", "input").split(\',\').map((function (item) {return +item}))'
            + '.reduce((function (num, item) {return num + item}), 0)'
        );
        expect(watchers).toEqual(['scope.input']);

        const getter = (arg1: string, arg2: string): string => {
            expect(arg1).toBe('scope');
            expect(arg2).toBe('input');
            return '123,456,789';
        };

        expect(func(getter)).toBe(1368);
    });

});
