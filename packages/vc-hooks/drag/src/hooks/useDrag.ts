/**
 * @file useDrag 拖拽函数
 */

import {Drag, IDragEvent} from '@co-hooks/drag';
import {Ref, onMounted, onUnmounted} from '@vue/composition-api';

export interface IDragOptions<T> {
    onDragPrepare?: (e: IDragEvent<T>) => void;
    onDragStart?: (e: IDragEvent<T>) => void;
    onDragging?: (e: IDragEvent<T>) => void;
    onDragEnd?: (e: IDragEvent<T>) => void;
    onClick?: (e: IDragEvent<T>) => void;
}

export function useDrag<T>(element: Ref<HTMLElement>, options: IDragOptions<T>): Drag<T> {

    const {
        onDragPrepare,
        onDragStart,
        onDragging,
        onDragEnd,
        onClick
    } = options;

    const drag = new Drag<T>();

    onMounted(() => {
        drag.init(element.value);
        onDragPrepare && drag.addListener('drag-prepare', onDragPrepare);
        onDragStart && drag.addListener('drag-start', onDragStart);
        onDragging && drag.addListener('dragging', onDragging);
        onDragEnd && drag.addListener('drag-end', onDragEnd);
        onClick && drag.addListener('click', onClick);
    });

    onUnmounted(() => {
        onDragPrepare && drag.removeListener('drag-prepare', onDragPrepare);
        onDragStart && drag.removeListener('drag-start', onDragStart);
        onDragging && drag.removeListener('dragging', onDragging);
        onDragEnd && drag.removeListener('drag-end', onDragEnd);
        onClick && drag.removeListener('click', onClick);
        drag.dispose();
    });

    return drag;
}
