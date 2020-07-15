/**
 * @file useMoveSortable
 */

import {Draggable} from '@co-hooks/draggable';
import {IMoveDraggableOptions, useMoveDraggable} from '@rc-hooks/draggable';
import {RefObject} from 'react';
import {useSortable} from './useSortable';

export function useMoveSortable<T>(
    target: RefObject<HTMLElement> | HTMLElement | null,
    options: Omit<IMoveDraggableOptions<T>, 'getContainer'>
): Draggable<T> {

    const sortable = useSortable();
    const {onDragEnd, onDragging, onDragStart, ...extra} = options;

    return useMoveDraggable(target, {
        getContainer: e => sortable.ensureDragRoot(e),
        dragLimit: sortable.getDragLimit(),
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
