/**
 * @file date 日相关方法
 */
import {createNumberConverter} from '../convert';
import {daysInMonth} from './month';

export const DATE_MILLISECONDS = 24 * 60 * 60 * 1000;

export function dayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((Number(end) - Number(start)) / DATE_MILLISECONDS) + 1;
}

export function buildFromDayOfYear(year: number, day: number): Date {

    let month = 0;

    while (month < 12) {
        const monthDay = daysInMonth(year, month);

        if (monthDay >= day) {
            return new Date(year, month, day);
        }

        month++;
        day -= monthDay;
    }

    throw new Error('day of year should < 365/366');
}

createNumberConverter({
    field: 'dateOfYear',
    format: 'DDD',
    paddingFormat: 'DDDD',
    maxLength: 3,
    getter: date => dayOfYear(date)
});

// DD 和 D
createNumberConverter({
    field: 'date',
    format: 'D',
    paddingFormat: 'DD',
    maxLength: 2,
    getter: date => date.getDate()
});
