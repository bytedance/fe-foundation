/**
 * @file useMark 获取Mark的信息
 */

import {useUpdate} from '@rc-hooks/use';
import {useEffect} from 'react';
import {AxisType} from '@co-hooks/region';
import {useAxis} from './useAxis';

export interface IMarkInfo {
    selected: boolean;
    offset: number;
    precisionValue: string;
    dragging: boolean;
}

export function useAxisMark(type: AxisType, value: number): IMarkInfo {

    const update = useUpdate();
    const axis = useAxis(type);
    const offset = axis.getValueOffset(value);
    const selected = axis.isValueSelected(value);
    const precisionValue = axis.formatPrecisionValue(value);

    useEffect(() => {

        axis.addListener('repaint', update);

        return () => axis.removeListener('repaint', update);
    }, []);


    return {
        offset,
        selected,
        precisionValue,
        dragging: axis.getRegion().getDragging()
    };
}
