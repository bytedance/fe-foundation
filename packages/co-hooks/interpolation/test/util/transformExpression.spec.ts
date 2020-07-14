/**
 * @file transformExpression.spec 表达式解析
 */

import * as path from 'path';
import * as fs from 'fs';
import glob from 'glob';
import {AstNodeType, IInterpolationOptions, ITransformResult, transformExpression} from '../../src';
import conf from './conf.json';

describe('transformExpression', () => {

    it('test', () => {

        const origin = '["未知", "待上线", "已上线", "已下线"][$context.config.status]';
        const options: IInterpolationOptions = {
            symbols: [
                {
                    symbol: 'context',
                    direct: false,
                    level: false
                },
                {
                    symbol: 'hooks',
                    direct: true,
                    level: false
                }
            ],
            default: 'context',
            call: 'hooks'
        };

        const result = transformExpression(origin, options);

        if (result) {

            const {
                expr,
                watchers,
                code
            } = result;

            expect(expr).toBe(origin);
            expect(code).toBe(
                '["未知", "待上线", "已上线", "已下线"][$_get_by_any("context", "config", "status")]'
            );
            expect(watchers).toEqual(['context.config.status']);
        }
    });

    it('compile', () => {

        const origin = 'a + $hooks.b';
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

        const result = transformExpression(origin, options);

        const {
            expr,
            watchers,
            func,
            code
        } = result;

        expect(expr).toBe(origin);
        expect(code).toBe('$_get_by_any("scope", "a") + $hooks.b');
        expect(watchers).toEqual(['scope.a']);

        const getter = (arg1: string, arg2: string) => {
            expect(arg1).toBe('scope');
            expect(arg2).toBe('a');
            return 1;
        };

        const $hooks = {
            b: 2
        };

        expect(func(getter, $hooks)).toBe(3);
    });

    it('compile error', () => {

        const origin = '$xxx + $hooks.b';
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

        expect(() => {
            transformExpression(origin, options);
        }).toThrow('$ is not allow in symbol');
    });

    it('test before', () => {

        const origin = '$xxx + $hooks.b';
        const options: IInterpolationOptions = {
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
            call: 'hooks',
            onBeforeProcess(transform, ast) {
                return {
                    ast,
                    watchers: []
                };
            }
        };

        const result = transformExpression(origin, options);

        const {
            expr,
            watchers,
            code
        } = result;

        expect(expr).toBe(origin);
        expect(code).toBe(origin);
        expect(watchers).toEqual([]);
    });

    it('test after', () => {

        const origin = '"a"';
        const options: IInterpolationOptions = {
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
            call: 'hooks',
            onAfterProcess(transform, ast): ITransformResult {
                return {
                    ast: {
                        type: AstNodeType.PROPERTY,
                        expression: {
                            type: AstNodeType.SYMBOL,
                            value: '$scope',
                            raw: '$scope'
                        },
                        property: ast
                    },
                    watchers: ['scope.a']
                };
            }
        };

        const result = transformExpression(origin, options);

        const {
            expr,
            watchers,
            code
        } = result;

        expect(expr).toBe(origin);
        expect(code).toBe('$scope["a"]');
        expect(watchers).toEqual(['scope.a']);
    });

    describe('valid test', () => {

        const list = glob.sync('transform/**/input.txt', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(10, -10);
            const p = path.join(__dirname, key);
            return [
                name,
                fs.readFileSync(p, 'utf8'),
                fs.readFileSync(path.resolve(p, '../output.txt'), 'utf8').trim(),
                JSON.parse(fs.readFileSync(path.resolve(p, '../watcher.json'), 'utf8'))
            ];
        });

        it.each(tests)('test parser %s', (name, input, output, watcher) => {

            const result = transformExpression(input, conf);
            const {code, watchers} = result;
            expect(code).toEqual(output);
            expect(watchers).toEqual(watcher);
        });
    });

    it('test inner call', () => {
        const origin = 'String(a)';
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

        const result = transformExpression(origin, options);

        const {
            expr,
            watchers,
            code
        } = result;

        expect(expr).toBe(origin);
        expect(code).toBe('String($_get_by_any("scope", "a"))');
        expect(watchers).toEqual(['scope.a']);
    });

    describe('invalid test', () => {

        const list = glob.sync('transform-error/**/input.txt', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(16, -10);
            const p = path.join(__dirname, key);
            return [
                name,
                fs.readFileSync(p, 'utf8'),
                fs.readFileSync(path.resolve(p, '../output.txt'), 'utf8').trim()
            ];
        });

        it.each(tests)('test generator %s', (name, input, output) => {
            expect(() => transformExpression(input, conf)).toThrow(output.trim());
        });
    });
});
