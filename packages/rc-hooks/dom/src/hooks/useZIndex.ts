/**
 * @file useZIndex 获取一个不变的ZIndex
 */

import {useMemo} from 'react';
import {getZIndex} from '@co-hooks/dom';

export function useZIndex(): number {
    return useMemo(() => getZIndex(), []);
}
