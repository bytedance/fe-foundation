/**
 * @file useDynamicDraggable
 */

import {useContainer} from '@rc-hooks/dom';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {RefObject, useEffect} from 'react';
import {
    Draggable,
    IDraggableEvent,
    IDraggableOptions,
    IScrollDirection
} from '@co-hooks/draggable';

export interface IDraggableEventHandler<T> {
    onDragPrepare?: (e: IDraggableEvent<T>) => void;
    onDragStart?: (e: IDraggableEvent<T>) => void;
    onDragging?: (e: IDraggableEvent<T>) => void;
    onDragEnd?: (e: IDraggableEvent<T>) => void;
    onScrollStart?: (dir: IScrollDirection) => void;
    onScrollEnd?: () => void;
    onBeforeCreateActionEle?: (ins: Draggable<T>) => void;
}

export type IDynamicDraggableOptions<T> = IDraggableEventHandler<T> & IDraggableOptions<T>;

export function useDynamicDraggable<T>(
    target: RefObject<HTMLElement> | HTMLElement | null,
    options: IDynamicDraggableOptions<T>
): Draggable<T> {

    const {
        onDragPrepare,
        onDragStart,
        onDragging,
        onDragEnd,
        onScrollStart,
        onScrollEnd,
        onBeforeCreateActionEle,
        ...extra
    } = options;

    const draggable: Draggable<T> = useSingleton(() => new Draggable<T>());
    const container = useContainer(target);
    const handleDragPrepare = useRefCallback(onDragPrepare);
    const handleDragStart = useRefCallback(onDragStart);
    const handleDragging = useRefCallback(onDragging);
    const handleDragEnd = useRefCallback(onDragEnd);
    const handleScrollStart = useRefCallback(onScrollStart);
    const handleScrollEnd = useRefCallback(onScrollEnd);
    const handleBeforeCreateActionEle = useRefCallback(onBeforeCreateActionEle);

    draggable.updateDraggableOptions(extra);

    useEffect(() => {
        const elem = container();

        if (elem) {
            draggable.updateTarget(elem);
        }
    }, [container()]);

    useEffect(() => {
        draggable.addListener('drag-prepare', handleDragPrepare);
        draggable.addListener('drag-start', handleDragStart);
        draggable.addListener('dragging', handleDragging);
        draggable.addListener('drag-end', handleDragEnd);
        draggable.addListener('scroll-start', handleScrollStart);
        draggable.addListener('scroll-end', handleScrollEnd);
        draggable.addListener('before-create-action-ele', handleBeforeCreateActionEle);


        return () => {
            draggable.removeListener('drag-prepare', handleDragPrepare);
            draggable.removeListener('drag-start', handleDragStart);
            draggable.removeListener('dragging', handleDragging);
            draggable.removeListener('drag-end', handleDragEnd);
            draggable.removeListener('scroll-start', handleScrollStart);
            draggable.removeListener('scroll-end', handleScrollEnd);
            draggable.removeListener('before-create-action-ele', handleBeforeCreateActionEle);
            draggable.dispose();
        };
    }, []);

    return draggable;
}
