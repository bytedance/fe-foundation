/**
 * @file useRangTime
 */

import {useCallback} from 'react';
import {IDateLocale} from '@co-hooks/util';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {IBaseTimeOptions, RangeTime, Time} from '@co-hooks/date';
import {useSimpleTime} from './useSimpleTime';

export interface IUseRangeTimeResult {
    root: RangeTime;
    leftPanel: Time;
    rightPanel: Time;
}

export interface ITimeRangDisabled {
    disabledHours?: (v: number) => boolean;
    disabledMinutes?: (v: number) => boolean;
    disabledSeconds?: (v: number) => boolean;
}

type ExcludeTimeOptions =
    | 'disabledHours'
    | 'disabledMinutes'
    | 'disabledSeconds';

export interface IRangTime extends Omit<IBaseTimeOptions, ExcludeTimeOptions> {
    value: string[];
    format?: string;
    onChange?: (newValue: string[]) => void;
    timeRangDisabled?: (part: 'start' | 'end') => ITimeRangDisabled;
}

export interface IRangTimeOptions extends IRangTime {
    locale: IDateLocale;
}

export function useRangeTime(options: IRangTimeOptions): IUseRangeTimeResult {
    const {value, onChange, timeRangDisabled, locale, ...extra} = options;
    const onChangeCallback = useRefCallback(onChange);

    const handleChange = useCallback(
        (newValue: string, part: 'left' | 'right') => {
            onChangeCallback(
                part === 'left'
                    ? [newValue, (value && value[1]) || '']
                    : [(value && value[0]) || '', newValue]
            );
        },
        [value]
    );

    const {
        disabledHours: startH = undefined,
        disabledMinutes: startM = undefined,
        disabledSeconds: startS = undefined
    } = timeRangDisabled ? timeRangDisabled('start') : {};
    const {
        disabledHours: endH = undefined,
        disabledMinutes: endM = undefined,
        disabledSeconds: endS = undefined
    } = timeRangDisabled ? timeRangDisabled('end') : {};

    const leftPanel = useSimpleTime({
        part: 'left',
        locale,
        value: value[0] || '',
        disabledHours: startH,
        disabledMinutes: startM,
        disabledSeconds: startS,
        onChange: val => handleChange(val, 'left'),
        ...extra
    });
    const rightPanel = useSimpleTime({
        part: 'right',
        locale,
        value: value[1] || '',
        disabledHours: endH,
        disabledMinutes: endM,
        disabledSeconds: endS,
        onChange: val => handleChange(val, 'right'),
        ...extra
    });
    const root = useSingleton(
        () => new RangeTime({left: leftPanel, right: rightPanel})
    );

    return {
        root,
        leftPanel,
        rightPanel
    };
}
