/**
 * @file format 将日期对象处理成日期字符串
 */
import {IDateLocale} from '../types';
import {getDateLocale} from './locale';
import {CONVERTER_MAP, TokenFormatter, tokenizer} from './convert';

function createEmptyFormat(token: string): TokenFormatter {
    return () => token;
}

export function formatDate(date: Date, format: string, locale?: IDateLocale): string {

    const tokens = tokenizer(format);
    const matched: string[] = tokens.map(token => {
        const fn = CONVERTER_MAP[token] ? CONVERTER_MAP[token].formatToken : createEmptyFormat(token);
        return fn(date, getDateLocale(locale));
    });

    return matched.join('');
}

export function formatDateArr(
    dateList: Array<string | Date>,
    format: string,
    locale: IDateLocale
): string[] {

    return dateList.map(item => {

        if (typeof item === 'string') {
            return item;
        }

        return formatDate(item, format, locale);
    });
}
