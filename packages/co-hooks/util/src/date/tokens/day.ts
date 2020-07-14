/**
 * @file day 星期相关方法
 */

import {createEnumConverter, createNumberConverter} from '../convert';

export function weekStart(date: Date, startDay: number): Date {
    const day = date.getDay();
    const offset = (day - startDay + 7) % 7;

    if (offset === 0) {
        return date;
    }

    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

export function getFirstOfMonth(sourceDate: Date, startDay: number): Date {
    return weekStart(new Date(sourceDate.getFullYear(), sourceDate.getMonth(), 1), startDay);
}

// dddd
createEnumConverter({
    format: 'dddd',
    localeKey: 'dayList',
    getter: date => date.getDay(),
    field: 'day'
});

// ddd
createEnumConverter({
    format: 'ddd',
    localeKey: 'shortDayList',
    getter: date => date.getDay(),
    field: 'day'
});

// dd
createEnumConverter({
    format: 'dd',
    localeKey: 'shortestDayList',
    getter: date => date.getDay(),
    field: 'day'
});

// d
createNumberConverter({
    field: 'day',
    format: 'd',
    maxLength: 1,
    getter: date => date.getDay()
});
