/**
 * @file guid.spec
 */

import {guid} from '..';

describe('test guid', () => {

    it('guid格式', () => {

        const ids = guid().split('-');
        const length = [8, 4, 4, 4, 12];

        expect(ids.length).toBe(5);
        ids.forEach((item, i) => {
            expect(item.length).toBe(length[i]);
        });
    });

    it('guid随机性测试', () => {

        const map: {[key: string]: boolean} = {};

        for (let i = 0; i < 100; i++) {

            const id = guid();

            expect(map[id]).toBeUndefined();

            map[id] = true;
        }
    });
});
