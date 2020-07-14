/**
 * @file Parser.spec 处理器函数
 */

import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import {Generator, Parser} from '../../src';

describe('Generator Teat', () => {

    describe('valid test', () => {

        const list = glob.sync('generator/**/**/input.txt', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(9, -10);
            const p = path.join(__dirname, key);
            return [
                name,
                fs.readFileSync(p, 'utf8'),
                fs.readFileSync(path.resolve(p, '../output.txt'), 'utf8').trim()
            ];
        });

        it.each(tests)('test parser %s', (name, input, output) => {
            const parser = new Parser(input);
            const ast = parser.process();
            const generator = new Generator(ast);
            const code = generator.process();
            expect(code).toEqual(output);
        });

    });

    describe('invalid test', () => {

        const list = glob.sync('generator-error/**/**/input.txt', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(15, -10);
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
            const generator = new Generator(ast);

            expect(() => {
                generator.process();
            }).toThrow(output.trim());
        });

    });
});
