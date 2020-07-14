/**
 * @file year 年相关方法
 */
import {createNumberConverter} from '../convert';

export function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInYear(year: number): number {
    return isLeapYear(year) ? 366 : 365;
}

// YYYY和YY
createNumberConverter({
    paddingFormat: 'YYYY',
    maxLength: 4,
    getter: date => date.getFullYear(),
    converter: (num, format) => {

        if (format === 'YY') {
            return num > 30 ? 1900 + num : 2000 + num;
        }
        return num;
    },
    field: 'year'
});

createNumberConverter({
    paddingFormat: 'YY',
    maxLength: 2,
    getter: date => date.getFullYear(),
    converter: num => (num > 30 ? 1900 + num : 2000 + num),
    field: 'year'
});
