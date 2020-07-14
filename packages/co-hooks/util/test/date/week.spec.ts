/**
 * @file date 日期相关测试
 */

import {buildWeekRange, formatDate, weekOfYear} from '../../src';
import {TEST_USED_LOCALE} from '../config';

describe('周相关测试', () => {

    const startDay = TEST_USED_LOCALE.startDay;

    describe('测试dayOfYear', () => {

        it('测试2019年1月1号', () => {
            expect(weekOfYear(new Date(2019, 0, 1), startDay)).toBe(1);
        });

        it('测试2018年12月31号', () => {
            expect(weekOfYear(new Date(2018, 11, 31), startDay, 2019)).toBe(1);
        });

        it('测试2019年1月6号', () => {
            expect(weekOfYear(new Date(2019, 0, 6), startDay)).toBe(1);
        });
    });

    describe('test build', () => {

        it('test build', () => {

            const [start, end] = buildWeekRange(2019, 1, TEST_USED_LOCALE.startDay);

            expect(formatDate(start, 'YYYY-MM-DD', TEST_USED_LOCALE)).toBe('2018-12-31');
            expect(formatDate(end, 'YYYY-MM-DD', TEST_USED_LOCALE)).toBe('2019-01-06');
        });

        it('test build', () => {

            const [start, end] = buildWeekRange(2019, 2, TEST_USED_LOCALE.startDay);

            expect(formatDate(start, 'YYYY-MM-DD', TEST_USED_LOCALE)).toBe('2019-01-07');
            expect(formatDate(end, 'YYYY-MM-DD', TEST_USED_LOCALE)).toBe('2019-01-13');
        });

        it('test build', () => {

            const [start, end] = buildWeekRange(2018, 53, TEST_USED_LOCALE.startDay);

            expect(formatDate(start, 'YYYY-MM-DD', TEST_USED_LOCALE)).toBe('2018-12-31');
            expect(formatDate(end, 'YYYY-MM-DD', TEST_USED_LOCALE)).toBe('2019-01-06');
        });

        it('test build', () => {

            const [start, end] = buildWeekRange(2019, 10, TEST_USED_LOCALE.startDay);

            expect(formatDate(start, 'YYYY-MM-DD', TEST_USED_LOCALE)).toBe('2019-03-04');
            expect(formatDate(end, 'YYYY-MM-DD', TEST_USED_LOCALE)).toBe('2019-03-10');
        });

        it('test build', () => {

            const [start, end] = buildWeekRange(2019, 38, 0);

            expect(formatDate(start, 'YYYY-MM-DD', {
                ...TEST_USED_LOCALE,
                startDay: 0
            })).toBe('2019-09-15');
            expect(formatDate(end, 'YYYY-MM-DD', {
                ...TEST_USED_LOCALE,
                startDay: 0
            })).toBe('2019-09-21');
        });

        it('test build', () => {

            const [start, end] = buildWeekRange(2019, 38, 2);

            expect(formatDate(start, 'YYYY-MM-DD', {
                ...TEST_USED_LOCALE,
                startDay: 2
            })).toBe('2019-09-17');
            expect(formatDate(end, 'YYYY-MM-DD', {
                ...TEST_USED_LOCALE,
                startDay: 2
            })).toBe('2019-09-23');
        });
    });

    // describe('测试D/DD转换器', () => {
    //
    //     it('日期小于10 - 格式化', () => {
    //         const date = new Date(2019, 0, 1);
    //         expect(formatDate(date, 'D', TEST_USED_LOCALE)).toBe('1');
    //         expect(formatDate(date, 'DD', TEST_USED_LOCALE)).toBe('01');
    //     });
    //
    //     it('日期小于10 - 分析', () => {
    //         expect(parseDate('2019-1-1', 'YYYY-M-D', TEST_USED_LOCALE).getDate()).toBe(1);
    //         expect(parseDate('2019-01-01', 'YYYY-MM-DD', TEST_USED_LOCALE).getDate()).toBe(1);
    //     });
    //
    //     it('日期大于10 - 格式化', () => {
    //         const date = new Date(2019, 0, 11);
    //         expect(formatDate(date, 'D', TEST_USED_LOCALE)).toBe('11');
    //         expect(formatDate(date, 'DD', TEST_USED_LOCALE)).toBe('11');
    //     });
    //
    //     it('日期大于10 - 分析', () => {
    //         expect(parseDate('2019-1-11', 'YYYY-M-D', TEST_USED_LOCALE).getDate()).toBe(11);
    //         expect(parseDate('2019-01-11', 'YYYY-MM-DD', TEST_USED_LOCALE).getDate()).toBe(11);
    //     });
    // });
    //
    // describe('测试DDD/DDDD转换器', () => {
    //
    //     it('年日期小于100 - 格式化', () => {
    //         const date = new Date(2020, 2, 1);
    //         expect(formatDate(date, 'DDD', TEST_USED_LOCALE)).toBe('61');
    //         expect(formatDate(date, 'DDDD', TEST_USED_LOCALE)).toBe('061');
    //     });
    //
    //     it('年日期大于100 - 格式化', () => {
    //         const date = new Date(2020, 11, 31);
    //         expect(formatDate(date, 'DDD', TEST_USED_LOCALE)).toBe('366');
    //         expect(formatDate(date, 'DDDD', TEST_USED_LOCALE)).toBe('366');
    //     });
    //
    //     it('日期小于10 - 分析', () => {
    //         expect(parseDate('2020-61', 'YYYY-DDD', TEST_USED_LOCALE).getDate()).toBe(1);
    //         expect(parseDate('2020-061', 'YYYY-DDD', TEST_USED_LOCALE).getDate()).toBe(1);
    //         expect(parseDate('2020-61', 'YYYY-DDD', TEST_USED_LOCALE).getMonth()).toBe(2);
    //         expect(parseDate('2020-061', 'YYYY-DDD', TEST_USED_LOCALE).getMonth()).toBe(2);
    //     });
    // });
});
