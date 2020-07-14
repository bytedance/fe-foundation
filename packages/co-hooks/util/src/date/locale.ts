/**
 * @file locale 本地语言
 */

import {IDateLocale} from '../types';

let DEFAULT_DATE_LOCALE: IDateLocale | null = null;

export function setDefaultDateLocale(locale: IDateLocale): void {
    DEFAULT_DATE_LOCALE = locale;
}

export function getDateLocale(locale?: IDateLocale): IDateLocale {

    if (locale != null) {
        return locale;
    }

    if (DEFAULT_DATE_LOCALE != null) {
        return DEFAULT_DATE_LOCALE;
    }

    throw new Error('you must provide `locale` param, or call `setDefaultDateLocale` first');
}
