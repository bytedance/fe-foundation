/**
 * @file date 日期相关测试
 */

import {dayOfYear, formatDate, parseDate} from '../../src';
import {TEST_USED_LOCALE} from '../config';

describe('日期相关测试', () => {

    describe('测试dayOfYear', () => {

        it('测试1月1号', () => {
            expect(dayOfYear(new Date(2019, 0, 1))).toBe(1);
        });

        it('测试2月1号', () => {
            expect(dayOfYear(new Date(2019, 1, 1))).toBe(32);
        });

        it('测试闰年的3月1号', () => {
            expect(dayOfYear(new Date(2020, 2, 1))).toBe(61);
        });

        it('测试闰年的12月31号', () => {
            expect(dayOfYear(new Date(2020, 11, 31))).toBe(366);
        });
    });

    describe('测试D/DD转换器', () => {

        it('日期小于10 - 格式化', () => {
            const date = new Date(2019, 0, 1);
            expect(formatDate(date, 'D', TEST_USED_LOCALE)).toBe('1');
            expect(formatDate(date, 'DD', TEST_USED_LOCALE)).toBe('01');
        });

        it('日期小于10 - 分析', () => {

            const date1 = parseDate('2019-1-1', 'YYYY-M-D', TEST_USED_LOCALE);
            const date2 = parseDate('2019-01-01', 'YYYY-MM-DD', TEST_USED_LOCALE);

            expect(date1 && date1.getDate()).toBe(1);
            expect(date2 && date2.getDate()).toBe(1);
        });

        it('日期大于10 - 格式化', () => {
            const date = new Date(2019, 0, 11);
            expect(formatDate(date, 'D', TEST_USED_LOCALE)).toBe('11');
            expect(formatDate(date, 'DD', TEST_USED_LOCALE)).toBe('11');
        });

        it('日期大于10 - 分析', () => {

            const date1 = parseDate('2019-1-11', 'YYYY-M-D', TEST_USED_LOCALE);
            const date2 = parseDate('2019-01-11', 'YYYY-MM-DD', TEST_USED_LOCALE);

            expect(date1 && date1.getDate()).toBe(11);
            expect(date2 && date2.getDate()).toBe(11);
        });
    });

    describe('测试DDD/DDDD转换器', () => {

        it('年日期小于100 - 格式化', () => {
            const date = new Date(2020, 2, 1);
            expect(formatDate(date, 'DDD', TEST_USED_LOCALE)).toBe('61');
            expect(formatDate(date, 'DDDD', TEST_USED_LOCALE)).toBe('061');
        });

        it('年日期大于100 - 格式化', () => {
            const date = new Date(2020, 11, 31);
            expect(formatDate(date, 'DDD', TEST_USED_LOCALE)).toBe('366');
            expect(formatDate(date, 'DDDD', TEST_USED_LOCALE)).toBe('366');
        });

        it('日期小于10 - 分析', () => {

            const date1 = parseDate('2020-61', 'YYYY-DDD', TEST_USED_LOCALE);
            const date2 = parseDate('2020-061', 'YYYY-DDD', TEST_USED_LOCALE);
            const date3 = parseDate('2020-61', 'YYYY-DDD', TEST_USED_LOCALE);
            const date4 = parseDate('2020-061', 'YYYY-DDD', TEST_USED_LOCALE);

            expect(date1 && date1.getDate()).toBe(1);
            expect(date2 && date2.getDate()).toBe(1);
            expect(date3 && date3.getMonth()).toBe(2);
            expect(date4 && date4.getMonth()).toBe(2);
        });
    });
});
