/**
 * @file useCopySortable
 */

import {Draggable} from '@co-hooks/draggable';
import {ICopyDraggableOptions, useCopyDraggable} from '@rc-hooks/draggable';
import {RefObject} from 'react';
import {useSortable} from './useSortable';

export function useCopySortable<T>(
    target: RefObject<HTMLElement> | HTMLElement | null,
    options: Omit<ICopyDraggableOptions<T>, 'getContainer'>
): Draggable<T> {

    const sortable = useSortable();
    const {onDragEnd, onDragging, onDragStart, ...extra} = options;

    return useCopyDraggable(target, {
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
