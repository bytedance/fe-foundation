/**
 * @file useAxis 获取坐标轴
 */

import {Axis, AxisType} from '@co-hooks/region';
import {useRegion} from './useRegion';

export function useAxis(type: AxisType): Axis {
    const region = useRegion();
    return region.getAxis(type);
}
