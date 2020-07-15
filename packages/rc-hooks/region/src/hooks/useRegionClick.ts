/**
 * @file useRegionClick
 */

import {useContainer} from '@rc-hooks/dom';
import {getElementPosition} from '@co-hooks/dom';
import {MouseEvent, RefObject, useCallback} from 'react';
import {useRegion} from './useRegion';

export function useRegionClick(elem: HTMLElement | RefObject<HTMLElement> | null): (e: MouseEvent) => void {

    const region = useRegion();
    const elemGetter = useContainer(elem);

    return useCallback((e: MouseEvent) => {

        const el = elemGetter();

        if (el == null) {
            return;
        }

        const offset = getElementPosition(el);
        const x = e.clientX - offset.left;
        const y = e.clientY - offset.top;
        const point = region.getPointByOffset({x, y});

        if (point.getDragging()) {
            point.setDragging(false);
        }

        point.updateRealOffset(point.getOffset(), {x, y});
    }, []);
}
