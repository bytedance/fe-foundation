/**
 * @file useSimpleTime
 */

import {useEffect} from 'react';
import {IBaseTimeOptions, Time} from '@co-hooks/date';
import {IDateLocale, formatDate, parseDate} from '@co-hooks/util';
import {useRefCallback, useRefGetter, useSingleton} from '@rc-hooks/use';

export interface ISimpleTime extends IBaseTimeOptions {
    value: string;
    format?: string;
    onChange?: (value: string) => void;
}

export interface ISimpleTimeOptions extends ISimpleTime {
    part: string;
    locale: IDateLocale;
}

export function useSimpleTime(options: ISimpleTimeOptions): Time {
    let {part, value, onChange, locale, format, ...extra} = options;
    const root = useSingleton(() => new Time(part));
    const onChangeCallback = useRefCallback(onChange);

    const formatGetter = useRefGetter(() => {
        const {showHour, showMinute, showSecond} = extra;
        if (format) {
            !/H|h/g.test(format) && (extra.showHour = false);
            !/m/g.test(format) && (extra.showMinute = false);
            !/s/g.test(format) && (extra.showSecond = false);
            return format;
        }

        if (showHour != null || showMinute != null || showSecond != null) {
            let formatStr = [
                showHour || showHour == null ? 'HH' : '',
                showMinute || showMinute == null ? 'mm' : '',
                showSecond || showSecond == null ? 'ss' : ''
            ]
                .filter(item => !!item)
                .join(':');
            return formatStr;
        }

        return locale.defaultFormat.time;
    });
    const date = parseDate(value, formatGetter()(), locale);

    root.updateOptions(extra);
    root.updateTime(date);

    useEffect(() => {
        const callback = (value: Date): void => {
            onChangeCallback(formatDate(value, formatGetter()(), locale));
        };

        root.addListener('value-change', callback);
        return () => {
            root.removeListener('value-change', callback);
        };
    }, []);

    return root;
}
