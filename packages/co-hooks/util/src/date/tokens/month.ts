/**
 * @file month 月相关方法
 */

import {createEnumConverter, createNumberConverter} from '../convert';
import {isLeapYear} from './year';

const MONTH_DATE_MAP = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function daysInMonth(year: number, month: number): number {

    if (month !== 1) {
        return MONTH_DATE_MAP[month];
    }

    return isLeapYear(year) ? 29 : 28;
}

// MMMM
createEnumConverter({
    format: 'MMMM',
    localeKey: 'monthList',
    getter: date => date.getMonth(),
    field: 'month'
});

// MMM
createEnumConverter({
    format: 'MMM',
    localeKey: 'shortMonthList',
    getter: date => date.getMonth(),
    field: 'month'
});

// MM 和 M
createNumberConverter({
    field: 'month',
    format: 'M',
    paddingFormat: 'MM',
    maxLength: 2,
    getter: date => date.getMonth() + 1,
    converter: num => num - 1
});
