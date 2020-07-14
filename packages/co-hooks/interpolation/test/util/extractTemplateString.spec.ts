/**
 * @file extract.spec.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import glob from 'glob';
import {extractTemplateString} from '../../src';

describe('extractTemplateString test', () => {

    describe('valid test', () => {

        const list = glob.sync('extract/**/input.txt', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(8, -10);
            const p = path.join(__dirname, key);
            return [
                name,
                fs.readFileSync(p, 'utf8'),
                fs.readFileSync(path.resolve(p, '../output.txt'), 'utf8').trim()
            ];
        });

        it.each(tests)('test parser %s', (name, input, output) => {
            expect(extractTemplateString(input)).toBe(output);
        });
    });

    describe('invalid test', () => {

        const list = glob.sync('extract-error/**/input.txt', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(14, -10);
            const p = path.join(__dirname, key);
            return [
                name,
                fs.readFileSync(p, 'utf8'),
                fs.readFileSync(path.resolve(p, '../output.txt'), 'utf8').trim()
            ];
        });

        it.each(tests)('test generator %s', (name, input, output) => {

            expect(() => {
                extractTemplateString(input);
            }).toThrow(output);
        });
    });
});
