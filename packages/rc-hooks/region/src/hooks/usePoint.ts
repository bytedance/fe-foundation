/**
 * @file useDimension 获取数据点
 */

import {Point} from '@co-hooks/region';
import {useRegion} from './useRegion';

export function usePoint(part: string): Point {
    const region = useRegion();
    return region.getPoint(part);
}
