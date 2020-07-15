/**
 * @file useMoveDraggable
 */
import {RefObject} from 'react';
import {Draggable, IDragType, IDraggableOptions} from '@co-hooks/draggable';
import {IDraggableEventHandler, useDynamicDraggable} from './useDynamicDraggable';

export type IMoveDraggableOptions<T>
    = Omit<IDraggableEventHandler<T>, 'before-create-action-ele'> & Omit<IDraggableOptions<T>, 'getDragType'>;

const MOVE_DRAG_TYPE = (): IDragType => 'move';

export function useMoveDraggable<T>(
    target: RefObject<HTMLElement> | HTMLElement | null,
    options: IMoveDraggableOptions<T>
): Draggable<T> {
    return useDynamicDraggable(target, {...options, getDragType: MOVE_DRAG_TYPE});
}
