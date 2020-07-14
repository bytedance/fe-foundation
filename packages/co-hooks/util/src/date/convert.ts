/**
 * @file convert 日期转换
 */

import {padding} from '../util';
import {IDateLocale} from '../types';

const TOKEN_REG = /(YYYY|YY|MMMM|MMM|MM|M|DDDD|DDD|DD|D|HH|H|hh|h|A|a|mm|m|ss|s|SSS|QQ|Q|WW|W|dddd|ddd|dd|d|.)/g;

export function tokenizer(format: string): string[] {

    const result: string[] = [];
    let matched = TOKEN_REG.exec(format);

    while (matched != null) {
        result.push(matched[0]);
        matched = TOKEN_REG.exec(format);
    }

    return result;
}

export interface IUsefulDateInfo {
    year: number;
    month: number;
    date: number;
    week: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    dateOfYear: number;
}

export type TokenFormatter = (date: Date, locale: IDateLocale) => string;

export type TokenParser = (str: string, locale: IDateLocale) => Partial<IUsefulDateInfo>;

export type TokenMatcher = (str: string, locale: IDateLocale) => false | string;

export interface IFormatTokenMap {
    [key: string]: {
        formatToken: TokenFormatter;
        matchToken: TokenMatcher;
        parseToken: TokenParser;
    };
}

export const CONVERTER_MAP: IFormatTokenMap = {};

export interface INumberConverterOptions {
    maxLength: 1 | 2 | 3 | 4;
    getter: (date: Date, locale: IDateLocale) => number;
    converter?: (num: number, format: string) => number;
    format?: string;
    paddingFormat?: string;

    field?: keyof IUsefulDateInfo;
}

function defaultConverter(num: number): number {
    return num;
}

export function createNumberConverter(options: INumberConverterOptions): void {

    const {maxLength, field, getter, format, paddingFormat, converter = defaultConverter} = options;

    if (format != null) {

        CONVERTER_MAP[format] = {
            formatToken(date: Date, locale: IDateLocale) {
                return String(getter(date, locale));
            },
            matchToken(str: string) {

                const reg = new RegExp(`^(\\d{1,${maxLength}})`);

                if (reg.test(str)) {
                    return RegExp.$1;
                }

                return false;
            },
            parseToken(str: string) {

                if (field == null) {
                    return {};
                }

                return {[field]: converter(parseInt(str, 10), format)};
            }
        };
    }

    if (paddingFormat != null) {

        CONVERTER_MAP[paddingFormat] = {
            formatToken(date: Date, locale: IDateLocale) {
                return padding(String(getter(date, locale)), maxLength);
            },
            matchToken(str: string) {

                const reg = new RegExp(`^(\\d{${maxLength}})`);

                if (reg.test(str)) {
                    return RegExp.$1;
                }

                return false;
            },
            parseToken(str: string) {

                if (field == null) {
                    return {};
                }

                return {[field]: converter(parseInt(str, 10), paddingFormat)};
            }
        };
    }
}

export interface IEnumConverterOptions {
    format: string;
    getter: (date: Date) => number;
    localeKey: Exclude<keyof IDateLocale, 'startDay' | 'defaultFormat'>;
    field?: keyof IUsefulDateInfo;
}

export function createEnumConverter(options: IEnumConverterOptions): void {

    const {format, field, getter, localeKey} = options;

    CONVERTER_MAP[format] = {
        formatToken(date: Date, locale: IDateLocale) {
            return locale[localeKey][getter(date)];
        },
        matchToken(str: string, locale: IDateLocale) {

            const reg = new RegExp('^(' + locale[localeKey].join('|') + ')');

            if (reg.test(str)) {
                return RegExp.$1;
            }

            return false;
        },
        parseToken(str: string, locale: IDateLocale) {

            const index = locale[localeKey].indexOf(str);

            if (field == null) {
                return {};
            }

            return {[field]: index};
        }
    };
}
