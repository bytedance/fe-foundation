/**
 * @file useRow 获取行信息
 */

import {getUniqueKey} from '@co-hooks/util';
import {useShallowState} from '@rc-hooks/use';
import {useEffect} from 'react';
import {useTable} from './useTable';

export interface ITableRowInfo<T> {
    id: string;
    fixedLeftColumns: string[];
    nonFixedColumns: string[];
    fixedRightColumns: string[];
}

export function useRow<T, K extends keyof T>(row: T): ITableRowInfo<T> {

    const table = useTable<T, unknown, K>();
    const leafColumnManager = table.getLeafColumnManager();
    const id = getUniqueKey(row[table.getRowKey()]);

    const update = (): Omit<ITableRowInfo<T>, 'row'> => ({
        id,
        fixedLeftColumns: leafColumnManager.getFixedLeftColumns(),
        fixedRightColumns: leafColumnManager.getFixedRightColumns(),
        nonFixedColumns: leafColumnManager.getNonFixedColumns()
    });

    const [info, setInfo] = useShallowState(update);

    useEffect(() => {

        const repaint = (): void => {
            setInfo(update());
        };

        table.addListener('repaint', repaint);

        return () => {
            table.removeListener('repaint', repaint);
        };
    }, []);

    return info;
}
