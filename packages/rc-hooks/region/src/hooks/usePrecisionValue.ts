/**
 * @file usePrecisionValue 输入类组件
 */

import {useRefGetter} from '@rc-hooks/use';
import {useCallback, useEffect, useState} from 'react';
import {AxisType} from '@co-hooks/region';
import {usePoint} from './usePoint';

export type INumberConverter = (value: string) => string;

export const DEFAULT_CONVERTER: INumberConverter = val => val;

// part和type不能变化
export function usePrecisionValue(
    part: string,
    type: AxisType,
    format: INumberConverter = DEFAULT_CONVERTER,
    parse: INumberConverter = DEFAULT_CONVERTER
): [string, (val: string) => void, () => void] {

    const point = usePoint(part);
    const formatGetter = useRefGetter(format);
    const parseGetter = useRefGetter(parse);
    const [value, setValue] = useState(() => formatGetter()(point.getPrecisionValue(type)));
    const valueRef = useRefGetter(value);

    const onInput = useCallback((val: string) => {
        setValue(val);
        point.setPrecisionValue(type, parseGetter()(val), true);
    }, []);

    const onBlur = useCallback(() => {

        const val = parseGetter()(valueRef());

        if (point.getAxis(type).isValidPrecisionValue(val)) {
            point.setPrecisionValue(type, val);
            return;
        }

        setValue(formatGetter()(point.getPrecisionValue(type)));
    }, []);


    useEffect(() => {

        const handleRepaint = (): void => {
            setValue(formatGetter()(point.getPrecisionValue(type)));
        };

        point.addListener('repaint', handleRepaint);

        return () => point.removeListener('repaint', handleRepaint);
    }, [point]);

    return [value, onInput, onBlur];
}
