/**
 * @file useCreateSortable
 */
import {IDraggableEvent} from '@co-hooks/draggable';
import {ISortableInfo, ISortableOptions, Sortable} from '@co-hooks/sortable';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {useEffect} from 'react';

export interface ICreateSortableOptions<T> extends ISortableOptions<T> {
    onDragStart?: (e: IDraggableEvent<T>) => void;
    onDragging?: (e: IDraggableEvent<T>) => void;
    onDragEnd?: (e: IDraggableEvent<T>) => void;
    onDragCancel?: () => void;
    onChange?: (e: IDraggableEvent<T>, from: ISortableInfo<T> | null, to: ISortableInfo<T>) => void;
}

export function useCreateSortable<T>(options: ICreateSortableOptions<T>): Sortable<T> {

    const {
        onDragStart,
        onDragging,
        onDragEnd,
        onDragCancel,
        onChange,
        ...extra
    } = options;

    const handleDragCancel = useRefCallback(onDragCancel);
    const handleDragStart = useRefCallback(onDragStart);
    const handleDragging = useRefCallback(onDragging);
    const handleDragEnd = useRefCallback(onDragEnd);
    const handleChange = useRefCallback(onChange);
    const sortable = useSingleton(() => new Sortable<T>());

    sortable.updateOptions(extra);

    useEffect(() => {

        sortable.addListener('drag-cancel', handleDragCancel);
        sortable.addListener('drag-start', handleDragStart);
        sortable.addListener('dragging', handleDragging);
        sortable.addListener('drag-end', handleDragEnd);
        sortable.addListener('change', handleChange);

        return () => {
            sortable.removeListener('drag-cancel', handleDragCancel);
            sortable.removeListener('drag-start', handleDragStart);
            sortable.removeListener('dragging', handleDragging);
            sortable.removeListener('drag-end', handleDragEnd);
            sortable.removeListener('change', handleChange);
            sortable.dispose();
        };
    }, []);

    return sortable;
}
