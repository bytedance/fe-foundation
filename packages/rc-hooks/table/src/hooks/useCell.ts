/**
 * @file useCell 获取单元格信息
 */

import {IRowExpandInfo} from '@co-hooks/table';
import {useShallowState} from '@rc-hooks/use';
import {useEffect} from 'react';
import {useTable} from './useTable';

export interface ITableCellInfo<T, E> {
    renderHead: () => E;
    renderData: (row: T, expand: IRowExpandInfo, onExpand: (expanded: boolean) => void) => E;
    className: string;
    width: number;
    isFirstShownColumn: boolean;
    isLastShownColumn: boolean;
}

export function useCell<T, E>(id: string): ITableCellInfo<T, E> {

    const table = useTable<unknown, E, never>();
    const columnManager = table.getColumnManager();
    const leafColumnManager = table.getLeafColumnManager();
    const column = columnManager.getColumn(id);

    // 不存在丢出错误
    if (column == null) {
        throw new Error('invalid column key = ' + id);
    }

    if (column.isGroup()) {
        throw new Error('column key = ' + id + ' is a column group');
    }

    const update = (): ITableCellInfo<T, E> => ({
        className: column.getClassName(),
        width: column.getWidth(),
        isFirstShownColumn: leafColumnManager.isFirstShowColumn(column.getKey()),
        isLastShownColumn: leafColumnManager.isLastShownColumn(column.getKey()),
        renderData: column.renderData,
        renderHead: column.renderHead
    });

    const [info, setInfo] = useShallowState(update);

    useEffect(() => {

        const callback = (): void => {
            setInfo(update());
        };

        table.addListener('repaint', callback);
        column.addListener('repaint', callback);

        return () => {
            table.removeListener('repaint', callback);
            column.removeListener('repaint', callback);
        };
    }, []);

    return info;
}
