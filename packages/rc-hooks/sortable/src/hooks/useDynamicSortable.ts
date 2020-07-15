/**
 * @file useDynamicSortable
 */

import {Draggable} from '@co-hooks/draggable';
import {IDynamicDraggableOptions, useDynamicDraggable} from '@rc-hooks/draggable';
import {RefObject} from 'react';
import {useSortable} from './useSortable';

export function useDynamicSortable<T>(
    target: RefObject<HTMLElement> | HTMLElement | null,
    options: Omit<IDynamicDraggableOptions<T>, 'getContainer'>
): Draggable<T> {

    const sortable = useSortable();
    const {onDragEnd, onDragging, onDragStart, ...extra} = options;

    return useDynamicDraggable(target, {
        getContainer: e => sortable.ensureDragRoot(e),
        onDragStart: e => {
            onDragStart && onDragStart(e);
            sortable.dragStart(e);
        },
        onDragging: e => {
            onDragging && onDragging(e);
            sortable.dragging(e);
        },
        onDragEnd: e => {
            onDragEnd && onDragEnd(e);
            sortable.dragEnd(e);
        },
        ...extra
    });
}
