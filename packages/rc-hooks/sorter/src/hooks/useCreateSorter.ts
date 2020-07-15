/**
 * @file useCreateSorter 创建一下拖拽容器
 */
import {ISortableContainerMode} from '@co-hooks/sortable';
import {Sortable, useCreateSortable} from '@rc-hooks/sortable';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {RefObject, useEffect} from 'react';
import {ISorterDragData, Sorter} from '@co-hooks/sorter';

export interface ISorterPlaceHolderInfo<T> {
    container: string;
    target: HTMLElement;
    index: number;
    data?: T;
}

export interface ISorterCreatorOptions<T, E> {
    onDraggingChange?: (dragging: boolean) => void;
    mode?: ISortableContainerMode;
    hittingContainerClassName?: string;
    renderPlaceHolder: (info: ISorterPlaceHolderInfo<ISorterDragData<T, E>>) => HTMLElement;
}

export function useCreateSorter<T, E>(
    ref: RefObject<HTMLElement>,
    options: ISorterCreatorOptions<T, E>
): [Sortable<ISorterDragData<T, E>>, Sorter<T, E>] {

    const {
        mode = 'horizontal',
        hittingContainerClassName,
        renderPlaceHolder,
        onDraggingChange
    } = options;

    const sorter = useSingleton(() => new Sorter<T, E>());
    const onDraggingChangeCallback = useRefCallback(onDraggingChange);

    const sortable = useCreateSortable<ISorterDragData<T, E>>({
        mode,
        hittingContainerClassName,
        createPlaceHolder: (id, index, e) => renderPlaceHolder({
            container: id,
            index,
            target: e.target,
            data: e.data
        }),
        getDragRoot: () => ref.current,
        getContainerMode: (id: string) => sorter.getContainerMode(id),
        onChange: (e, from, to) => sorter.setSorter(from, to),
        isValidContainer: (data, id) => sorter.isValidContainer(data, id),
        onDragStart: e => sorter.setDragging(true, e.data),
        onDragCancel: () => sorter.setDragging(false),
        onDragEnd: () => sorter.setDragging(false)
    });

    useEffect(() => {

        sorter.addListener('dragging-change', onDraggingChangeCallback);

        return () => {
            sorter.removeListener('dragging-change', onDraggingChangeCallback);
        };
    }, []);

    return [sortable, sorter];
}
