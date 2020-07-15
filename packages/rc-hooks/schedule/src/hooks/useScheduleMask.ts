/**
 * @file useScheduleMask 获取mask信息及内容
 */
import {IDragEvent} from '@co-hooks/drag';
import {IElementPosition} from '@co-hooks/dom';
import {useDrag} from '@rc-hooks/drag';
import {useSingleton, useUpdate} from '@rc-hooks/use';
import {RefObject, useCallback, useEffect} from 'react';
import {useElementPosition} from '@rc-hooks/dom';
import {IScheduleMaskRelativeRect, ScheduleMask} from '@co-hooks/schedule';
import {useSchedule} from './useSchedule';

export interface IUseScheduleMaskResult {
    maskRelativeRect: IScheduleMaskRelativeRect | null;
    dragging: boolean;
}

export function useScheduleMask(
    elem: HTMLElement | RefObject<HTMLElement> | null,
    name: string,
    draggable: boolean
): IUseScheduleMaskResult {

    const schedule = useSchedule();
    const mask = useSingleton(() => new ScheduleMask(schedule));
    const update = useUpdate();

    const onDragStart = useCallback((e: IDragEvent<null>) => {
        mask.updateStartPos(e.startMousePos);
    }, []);

    const onDragging = useCallback((e: IDragEvent<null>) => {
        mask.updateEndPos(e.currentMousePos);
    }, []);

    const onDragEnd = useCallback((e: IDragEvent<null>) => {
        mask.stopDrag(e.currentMousePos);
    }, []);

    const updateColSize = useCallback(() => {
        mask.updateColSize();
    }, []);

    useDrag(elem, {
        draggable,
        data: null,
        onDragEnd,
        onDragging,
        onDragStart
    });

    useElementPosition(
        elem,
        () => true,
        (rect: IElementPosition) => {
            mask.updateBoxRect(rect);
        },
        {}
    );

    useEffect(() => {
        mask.addListener('repaint', update);
        schedule.addListener('datasource-update', updateColSize);

        return () => {
            mask.removeListener('repaint', update);
            schedule.removeListener('datasource-update', updateColSize);
        };
    }, []);


    return {
        maskRelativeRect: mask.getMaskRelativeRect(),
        dragging: mask.getDragging()
    };
}
