/**
 * @file useUpStep 上一步
 */

import {useUpdate} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {AxisType} from '@co-hooks/region';
import {usePoint} from './usePoint';

export function useUpStep(part: string, type: AxisType): [boolean, (stepCount?: number) => void] {

    const update = useUpdate();
    const point = usePoint(part);
    const value = point.getPrecisionValue(type);
    const {step, max} = point.getAxis(type).getAxisConfig();

    useEffect(() => {

        point.addListener('repaint', update);

        return () => point.removeListener('repaint', update);
    }, [point]);

    const handler = useCallback((stepCount?: number) => {
        point.upStep(type, stepCount);
    }, [point]);

    return [+value + step > max, handler];
}
