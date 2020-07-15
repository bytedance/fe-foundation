/**
 * @file useSorterContainer
 */
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {Container, ISorterContainerOptions} from '@co-hooks/sorter';
import {useSorter} from './useSorter';

export interface ISorterContainerInfo<E> {
    onRemove: (index: number) => void;
}

export interface ISorterContainerExtra<E> {
    name: string;
    onValueChange?: (value: E[]) => void;
    onDraggingChange?: (dragging: boolean) => void;
}

export function useSorterContainer<T, E>(
    options: ISorterContainerOptions<T, E> & ISorterContainerExtra<E>
): ISorterContainerInfo<E> {

    const {
        name,
        data,
        mode,
        convertData,
        isValidContainer,
        onValueChange,
        onDraggingChange
    } = options;

    const sorter = useSorter<T, E>();
    const container = useSingleton(() => new Container(name, sorter));
    const onValueChangeCallback = useRefCallback(onValueChange);
    const onDraggingChangeCallback = useRefCallback(onDraggingChange);

    container.updateOptions({
        data,
        mode,
        convertData,
        isValidContainer
    });

    const onRemove = useCallback((index: number) => {
        container.removeElement(index);
    }, []);

    useEffect(() => {

        container.addListener('change', onValueChangeCallback);
        container.addListener('dragging-change', onDraggingChangeCallback);

        return () => {
            container.removeListener('change', onValueChangeCallback);
            container.removeListener('dragging-change', onDraggingChangeCallback);
            container.dispose();
        };
    }, []);

    return {
        onRemove
    };
}
