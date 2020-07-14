/**
 * @file Parser.spec 处理器函数
 */

import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import {Parser} from '../../src';

describe('Parser Teat', () => {

    describe('valid test', () => {

        const list = glob.sync('valid-parser/**/**/input.txt', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(13, -10);
            const p = path.join(__dirname, key);
            return [
                name,
                fs.readFileSync(p, 'utf8'),
                JSON.parse(fs.readFileSync(path.resolve(p, '../output.json'), 'utf8'))
            ];
        });

        it.each(tests)('test parser %s', (name, input, output) => {
            const parser = new Parser(input);
            const ast = parser.process();
            expect(ast).toEqual(output);
        });

    });

    describe('invalid test', () => {

        const list = glob.sync('invalid-parser/**/**/input.txt', {
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

        it.each(tests)('test parser %s', (name, input, output) => {

            const parser = new Parser(input);

            expect(() => {
                parser.process();
            }).toThrow(output.trim());
        });

    });
});
