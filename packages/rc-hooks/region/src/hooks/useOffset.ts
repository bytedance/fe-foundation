/**
 * @file useOffset
 */

import {useUpdate} from '@rc-hooks/use';
import {useEffect} from 'react';
import {AxisType} from '@co-hooks/region';
import {useAxis} from './useAxis';

export function useOffset(type: AxisType, value: number): number {

    const update = useUpdate();
    const axis = useAxis(type);
    const offset = axis.getValueOffset(value);

    useEffect(() => {

        axis.addListener('repaint', update);

        return () => axis.removeListener('repaint', update);

    }, [axis]);

    return offset;
}
