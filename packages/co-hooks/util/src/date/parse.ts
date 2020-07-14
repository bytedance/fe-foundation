/**
 * @file parse 将日期字符串处理成日期对象
 */

import {IDateLocale} from '../types';
import {isNullOrUndefined} from '../util';
import {getDateLocale} from './locale';
import {buildFromWeek} from './tokens/week';
import {CONVERTER_MAP, IUsefulDateInfo, TokenMatcher, TokenParser, tokenizer} from './convert';
import {buildFromDayOfYear} from './tokens/date';

function createEmptyMatcher(token: string): TokenMatcher {

    return str => {

        const matched = str.slice(0, token.length);

        if (matched === token) {
            return matched;
        }

        return false;
    };
}

function createEmptyParser(): TokenParser {
    return () => ({});
}

interface IBuildDateInvalid {
    valid: false;
    message: string;
}

interface IBuildDateValid {
    valid: true;
    date: Date;
    exact: boolean;
}

type IBuildDateResult = IBuildDateValid | IBuildDateInvalid;

function buildDate(info: Partial<IUsefulDateInfo>, startDay: number): IBuildDateResult {

    const {
        // 年必须提供，不然没办法处理
        year,
        month,
        date,
        week,
        day,
        hour,
        minute,
        second,
        dateOfYear
    } = info;

    if (!isNullOrUndefined(hour) || !isNullOrUndefined(minute) || !isNullOrUndefined(second)) {
        if (isNullOrUndefined(month) || isNullOrUndefined(year) || isNullOrUndefined(date)) {
            const newDate = new Date();
            newDate.setHours(hour || 0);
            newDate.setMinutes(minute || 0);
            newDate.setSeconds(second || 0);

            return {
                valid: true,
                exact: true,
                date: newDate
            };
        }

        return {
            valid: true,
            exact: true,
            date: new Date(year, month, date, hour || 0, minute || 0, second || 0)
        };
    }

    if (year == null) {
        throw new Error('year is required');
    }

    try {
        // Month和Date存在
        if (month != null && date != null) {

            return {
                valid: true,
                exact: true,
                date: new Date(year, month, date)
            };
        }

        // Week和Day存在
        if (week != null && day != null) {
            return {
                valid: true,
                exact: true,
                date: buildFromWeek(year, week, day, startDay)
            };
        }

        // 使用DayOfYear生成
        if (dateOfYear != null) {
            return {
                valid: true,
                exact: true,
                date: buildFromDayOfYear(year, dateOfYear)
            };
        }

        // 如果只有月存在
        if (month != null) {
            return {
                valid: true,
                exact: false,
                date: new Date(year, month, 1)
            };
        }

        // 如果只有周存在
        if (week != null) {
            return {
                valid: true,
                exact: false,
                date: buildFromWeek(year, week, 0, startDay)
            };
        }

        // 只有年的情况
        return {
            valid: true,
            exact: false,
            date: new Date(year, 0, 1)
        };
    } catch (e) {
        return {
            valid: false,
            message: e.message
        };
    }
}

export function parseDate(
    str: string,
    format: string,
    locale?: IDateLocale,
    strict: boolean = false
): Date | undefined {

    if (str == null || str === '') {
        return;
    }

    // remove all whitespace
    str = str.replace(/\s+/g, '');
    const tokens = tokenizer(format.replace(/\s+/g, ''));
    let valid = true;
    let firstErrorPos = 0;
    let left = str;
    const info: Partial<IUsefulDateInfo> = {};

    tokens.map(token => {

        if (!valid) {
            return;
        }

        const matchToken = CONVERTER_MAP[token] ? CONVERTER_MAP[token].matchToken : createEmptyMatcher(token);
        const parseToken = CONVERTER_MAP[token] ? CONVERTER_MAP[token].parseToken : createEmptyParser();
        const matched = matchToken(left, getDateLocale(locale));

        if (matched === false) {
            valid = false;
            firstErrorPos = str.length - left.length;
            return;
        }

        Object.assign(info, parseToken(matched, getDateLocale(locale)));
        left = left.slice(matched.length);
    });

    if (!valid) {
        console.error(`parse date string error, format = ${format} str =${str} pos=${firstErrorPos}`);
        return;
    }

    const result = buildDate(info, getDateLocale(locale).startDay);

    if (!result.valid) {
        console.error('parse date string error, format = ' + format + ' str =' + str + ' error=' + result.message);
        return;
    }

    if (strict && !result.exact) {
        console.error('parse date string error, format = ' + format
            + ' str =' + str + ' error= missing required date info, such as month and date');
        return;
    }

    return result.date;
}

export function parseDateArr(
    dateList: Array<string | Date>,
    format: string,
    locale: IDateLocale,
    strict: boolean
): Date[] {

    const ret: Date[] = [];

    dateList.forEach(date => {

        if (typeof date === 'string') {
            const d = parseDate(date, format, locale, strict);

            if (d != null) {
                ret.push(d);
            }
        } else {
            ret.push(date);
        }
    });

    return ret;
}
