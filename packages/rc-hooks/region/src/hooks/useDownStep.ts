/**
 * @file useDownStep 下一步
 */

import {useUpdate} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {AxisType} from '@co-hooks/region';
import {usePoint} from './usePoint';

export function useDownStep(part: string, type: AxisType): [boolean, (stepCount?: number) => void] {

    const update = useUpdate();
    const point = usePoint(part);
    const value = point.getPrecisionValue(type);
    const {step, min} = point.getAxis(type).getAxisConfig();

    useEffect(() => {

        point.addListener('repaint', update);

        return () => point.removeListener('repaint', update);
    }, [point]);

    const handler = useCallback((stepCount?: number) => {
        point.downStep(type, stepCount);
    }, []);

    return [+value - step < min, handler];
}
