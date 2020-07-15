/**
 * @file useSortable
 */

import {Sortable} from '@co-hooks/sortable';
import {useContext} from 'react';
import {SortableContext} from '../context/sortable';

export function useSortable<T>(): Sortable<T> {

    const sortable = useContext(SortableContext);

    if (sortable == null) {
        throw new Error('useSortable must be use under RcSortableProvider');
    }

    return sortable;
}
