/**
 * @file useMark 获取Mark的信息
 */

import {IOffset, getDefaultOffset} from '@co-hooks/dom';
import {useDrag} from '@rc-hooks/drag';
import {IDragEvent} from '@co-hooks/drag';
import {useRefGetter, useUpdate} from '@rc-hooks/use';
import {RefObject, useCallback, useEffect, useRef} from 'react';
import {IPrecisionOffset} from '@co-hooks/region';
import {usePoint} from './usePoint';

export interface IDraggerInfo {
    selected: boolean;
    offset: IOffset;
    precision: IPrecisionOffset;
    dragging: boolean;
}

export function useDragger(
    elem: HTMLElement | RefObject<HTMLElement> | null,
    name: string,
    draggable: boolean
): IDraggerInfo {

    const update = useUpdate();
    const point = usePoint(name);
    const region = point.getRegion();
    const value = point.getPointValue();
    const offset = point.getOffset();
    const selected = region.isValueSelected(value);
    const startOffsetRef = useRef(getDefaultOffset());
    const offsetGetter = useRefGetter(offset);

    const onDragStart = useCallback(() => {
        startOffsetRef.current = offsetGetter();
        point.setDragging(true);
    }, []);

    const onDragging = useCallback((e: IDragEvent<null>) => {
        const deltaX = e.currentMousePos.clientX - e.startMousePos.clientX;
        const deltaY = e.currentMousePos.clientY - e.startMousePos.clientY;
        const x = deltaX + startOffsetRef.current.x;
        const y = deltaY + startOffsetRef.current.y;
        point.updateRealOffset(startOffsetRef.current, {x, y});
    }, []);

    const onDragEnd = useCallback((e: IDragEvent<null>) => {
        const deltaX = e.currentMousePos.clientX - e.startMousePos.clientX;
        const deltaY = e.currentMousePos.clientY - e.startMousePos.clientY;
        const x = deltaX + startOffsetRef.current.x;
        const y = deltaY + startOffsetRef.current.y;
        point.setDragging(false);
        point.updateRealOffset(startOffsetRef.current, {x, y});
        startOffsetRef.current = getDefaultOffset();
    }, []);

    useDrag(elem, {
        draggable,
        data: null,
        onDragEnd,
        onDragging,
        onDragStart
    });

    useEffect(() => {

        point.addListener('repaint', update);

        return () => point.removeListener('repaint', update);
    }, [point]);


    return {
        offset,
        selected,
        precision: point.getOffsetPrecisionValue(),
        dragging: point.getDragging()
    };
}
