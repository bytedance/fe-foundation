/**
 * @file useSorterCreateElement
 */
import {useCopySortable} from '@rc-hooks/sortable';
import {RefObject} from 'react';
import {ISorterDragCreateData} from '@co-hooks/sorter';

export function useSorterCreateElement<T>(ref: RefObject<HTMLElement>, data: T): void {

    useCopySortable<ISorterDragCreateData<T>>(ref, {
        data: {
            type: 'create',
            data
        }
    });
}
