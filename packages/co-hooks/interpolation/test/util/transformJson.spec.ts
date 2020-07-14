/**
 * @file transformJson 对象生成器
 */

import * as path from 'path';
import * as fs from 'fs';
import glob from 'glob';
import {transformJson} from '../../src';
import conf from './conf.json';

describe('transformJson test', () => {

    describe('valid test', () => {

        const list = glob.sync('builder/issue/**/input.json', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(8, -10);
            const p = path.join(__dirname, key);

            return [
                name,
                JSON.parse(fs.readFileSync(p, 'utf8')),
                JSON.parse(fs.readFileSync(path.resolve(p, '../binding.json'), 'utf8')),
                fs.readFileSync(path.resolve(p, '../output.txt'), 'utf8').trim(),
                JSON.parse(fs.readFileSync(path.resolve(p, '../watcher.json'), 'utf8'))
            ];
        });

        it.each(tests)('test parser %s', (name, input, binging, output, watcher) => {

            const {code, watchers} = transformJson(input, conf, binging);

            expect(code).toBe(output);
            expect(watchers).toEqual(watcher);
        });
    });

    describe('valid test', () => {

        const list = glob.sync('builder/**/input.json', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(8, -10);
            const p = path.join(__dirname, key);

            return [
                name,
                JSON.parse(fs.readFileSync(p, 'utf8')),
                JSON.parse(fs.readFileSync(path.resolve(p, '../binding.json'), 'utf8')),
                fs.readFileSync(path.resolve(p, '../output.txt'), 'utf8').trim(),
                JSON.parse(fs.readFileSync(path.resolve(p, '../watcher.json'), 'utf8'))
            ];
        });

        it.each(tests)('test parser %s', (name, input, binging, output, watcher) => {

            const {code, watchers} = transformJson(input, conf, binging);

            expect(code).toBe(output);
            expect(watchers).toEqual(watcher);
        });
    });

    describe('invalid test', () => {

        const list = glob.sync('builder-error/**/input.json', {
            cwd: __dirname
        });

        const tests: any[][] = list.map(key => {

            const name = key.slice(14, -11);
            const p = path.join(__dirname, key);
            return [
                name,
                JSON.parse(fs.readFileSync(p, 'utf8')),
                JSON.parse(fs.readFileSync(path.resolve(p, '../binding.json'), 'utf8')),
                fs.readFileSync(path.resolve(p, '../output.txt'), 'utf8').trim()
            ];
        });

        it.each(tests)('test generator %s', (name, input, binging, output) => {

            expect(() => {
                transformJson(input, conf, binging);
            }).toThrow(output);
        });

        it('test generator error', () => {

            expect(() => {
                transformJson({foo: () => void 0}, conf, []);
            }).toThrow('invalid json type');
        });
    });
});
