/**
 * @file useRowGroup 获取可展开行信息
 */
import {IRowGroupItem, IRowGroupOptions, RowGroup, useTable} from '@rc-hooks/table';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {ReactNode, useCallback, useEffect} from 'react';

export interface ITableRowGroupInfo<T, K extends keyof T> {
    rowKey: K;
    rows: Array<IRowGroupItem<T>>;
    onExpand: (id: string, expanded: boolean) => void;
}

export interface ITableRowGroupOptions<T, K extends keyof T> extends IRowGroupOptions<T, K> {
    onExpandedRowChange?: (keys: Array<T[K]>) => void;
}

export function useRowGroup<T, K extends keyof T>(options: ITableRowGroupOptions<T, K>): ITableRowGroupInfo<T, K> {

    const table = useTable<T, ReactNode, K>();
    const group = useSingleton(() => new RowGroup(table));
    const onExpandedRowChange = useRefCallback(options.onExpandedRowChange);

    group.updateRowGroup(options);

    const onExpand = useCallback((id: string, expanded: boolean) => group.setRowExpand(id, expanded), []);

    useEffect(() => {

        group.addListener('expanded-change', onExpandedRowChange);

        return () => group.removeListener('expanded-change', onExpandedRowChange);
    }, []);

    return {
        rowKey: table.getRowKey(),
        rows: group.getRenderRows(),
        onExpand
    };
}
