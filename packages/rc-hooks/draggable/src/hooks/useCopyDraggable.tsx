/**
 * @file useCopyDraggable
 */
import {RefObject} from 'react';
import {Draggable, IDragType, IDraggableOptions} from '@co-hooks/draggable';
import {IDraggableEventHandler, useDynamicDraggable} from './useDynamicDraggable';

export type ICopyDraggableOptions<T> = IDraggableEventHandler<T> & Omit<IDraggableOptions<T>, 'getDragType'>;

const COPY_DRAG_TYPE = (): IDragType => 'copy';

export function useCopyDraggable<T>(
    target: RefObject<HTMLElement> | HTMLElement | null,
    options: ICopyDraggableOptions<T>
): Draggable<T> {
    return useDynamicDraggable(target, {...options, getDragType: COPY_DRAG_TYPE});
}
