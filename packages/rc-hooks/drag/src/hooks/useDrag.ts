/**
 * @file useDra
 */
import {useContainer} from '@rc-hooks/dom';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {RefObject, useEffect} from 'react';
import {Drag, IDrag, IDragEvent} from '@co-hooks/drag';

export interface IDragOptions<T> extends IDrag<T> {
    onDragPrepare?: (e: IDragEvent<T>) => void;
    onDragStart?: (e: IDragEvent<T>) => void;
    onDragging?: (e: IDragEvent<T>) => void;
    onDragEnd?: (e: IDragEvent<T>) => void;
    onClick?: (e: IDragEvent<T>) => void;
}

export function useDrag<T>(
    element: HTMLElement | null | RefObject<HTMLElement>,
    options: IDragOptions<T>
): Drag<T> {

    const {
        draggable,
        trigger,
        data,
        onDragPrepare,
        onDragStart,
        onDragging,
        onDragEnd,
        onClick
    } = options;

    const drag = useSingleton(() => new Drag<T>());
    const elementGetter = useContainer(element);
    const handleDragPrepare = useRefCallback(onDragPrepare);
    const handleDragStart = useRefCallback(onDragStart);
    const handleDragging = useRefCallback(onDragging);
    const handleDragEnd = useRefCallback(onDragEnd);
    const handleClick = useRefCallback(onClick);

    drag.updateOptions({draggable, trigger, data});

    useEffect(() => {

        const elem = elementGetter();

        if (elem == null) {
            return;
        }

        drag.init(elem);

    }, [elementGetter()]);

    useEffect(() => {

        drag.addListener('drag-prepare', handleDragPrepare);
        drag.addListener('drag-start', handleDragStart);
        drag.addListener('dragging', handleDragging);
        drag.addListener('drag-end', handleDragEnd);
        drag.addListener('click', handleClick);

        return () => {
            drag.removeListener('drag-prepare', handleDragPrepare);
            drag.removeListener('drag-start', handleDragStart);
            drag.removeListener('dragging', handleDragging);
            drag.removeListener('drag-end', handleDragEnd);
            drag.removeListener('click', handleClick);
            drag.dispose();
        };
    }, []);

    return drag;
}
