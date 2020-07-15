/**
 * @file useCreateTable
 */
import {useSingleton} from '@rc-hooks/use';
import {ITableOptions, Table} from '@co-hooks/table';
import {RefObject} from 'react';
import {useElementSize} from '@rc-hooks/dom';

export function useCreateTable<T, E, K extends keyof T>(
    ref: RefObject<HTMLElement>,
    options: ITableOptions<T, E, K>
): Table<T, E, K> {

    // rowKey不能变化
    const table = useSingleton(() => new Table<T, E, K>(options.rowKey));

    useElementSize(ref, () => true, size => table.updateTableSize(size));

    table.updateTableOptions(options);

    return table;
}
