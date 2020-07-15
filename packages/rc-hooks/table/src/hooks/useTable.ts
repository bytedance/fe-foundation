/**
 * @file useTable
 */
import {useContext} from 'react';
import {Table} from '@co-hooks/table';
import {TableContext} from '../context/table';

export function useTable<T, E, K extends keyof T>(): Table<T, E, K> {

    const table = useContext(TableContext);

    if (table == null) {
        throw new Error('useTable must be use under RcTableProvider');
    }

    return table as Table<T, E, K>;
}
