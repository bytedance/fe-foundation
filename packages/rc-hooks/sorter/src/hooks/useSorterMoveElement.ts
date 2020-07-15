/**
 * @file useSorterMoveElement
 */
import {useMoveSortable} from '@rc-hooks/sortable';
import {RefObject} from 'react';
import {ISorterDragMoveData} from '@co-hooks/sorter';

export function useSorterMoveElement<T>(ref: RefObject<HTMLElement>, data: T): void {

    useMoveSortable<ISorterDragMoveData<T>>(ref, {
        data: {
            type: 'move',
            data
        }
    });
}
