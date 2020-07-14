/**
 * @file Transform.spec 处理器函数
 */

import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import {Generator, Parser, Transform} from '../../src';
import conf from '../util/conf.json';

describe('Transform Test', () => {

    describe('valid test', () => {

        const list = glob.sync('transform/**/**/input.txt', {
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
            const parser = new Parser(input);
            const ast = parser.process();
            const transform = new Transform(ast, conf);
            const {ast: transformedAst, watchers} = transform.process();
            const generator = new Generator(transformedAst);
            const code = generator.process();
            expect(code).toEqual(output);
            expect(watchers).toEqual(watcher);
        });

    });

    describe('invalid test', () => {

        const list = glob.sync('transform-error/**/**/input.txt', {
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

            const parser = new Parser(input);
            const ast = parser.process();
            const transform = new Transform(ast, conf);

            expect(() => {
                transform.process();
            }).toThrow(output.trim());
        });

    });

    describe('多次转换应当不会出问题', () => {

        const list = glob.sync('transform/**/**/input.txt', {
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
            const parser = new Parser(input);
            const ast = parser.process();
            const transform = new Transform(ast, conf);
            const {ast: transformedAst, watchers} = transform.process();
            const transform2 = new Transform(transformedAst, conf);
            const {ast: transformedAst2, watchers: watchers2} = transform2.process();
            const generator = new Generator(transformedAst2);
            const code = generator.process();
            expect(code).toEqual(output);
            expect(watchers).toEqual(watcher);
            expect(watchers2).toEqual(watcher);
        });

    });
});
