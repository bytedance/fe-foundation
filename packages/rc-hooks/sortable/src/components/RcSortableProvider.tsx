/**
 * @file RcSelectProvider
 */

import React from 'react';
import {Sortable} from '@co-hooks/sortable';
import {SortableContext} from '../context/sortable';

export interface IRcSortableProviderProps<T> {
    sortable: Sortable<T>;
    children: React.ReactNode;
}

export function RcSortableProvider<T>(props: IRcSortableProviderProps<T>): JSX.Element {

    const {children, sortable} = props;

    return (
        <SortableContext.Provider value={sortable}>
            {children}
        </SortableContext.Provider>
    );
}
