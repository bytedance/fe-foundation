/**
 * @file useColumnGroup 获取列分组信息
 */

import {useShallowState} from '@rc-hooks/use';
import {ReactNode, useCallback, useEffect} from 'react';
import {useTable} from './useTable';

export interface IColumnGroup<E> {
    renderHead: () => ReactNode;
    columnKeys: string[];
    isFirstShownColumn: boolean;
    isLastShownColumn: boolean;
}

export function useColumnGroup<E>(id: string): IColumnGroup<E> {

    const table = useTable<unknown, E, never>();
    const columnManager = table.getColumnManager();
    const leafColumnManager = table.getLeafColumnManager();
    const column = columnManager.getColumn(id);

    // 不存在丢出错误
    if (column == null) {
        throw new Error('invalid column key = ' + id);
    }

    if (!column.isGroup()) {
        throw new Error('column key = ' + id + ' is not a column group');
    }
    const update = (): Omit<IColumnGroup<E>, 'renderHead'> => ({
        columnKeys: column.getRenderColumnKeys(),
        isFirstShownColumn: leafColumnManager.isFirstShowColumn(column.getKey()),
        isLastShownColumn: leafColumnManager.isLastShownColumn(column.getKey())
    });

    const renderHead = useCallback(() => column.renderHead(), []);
    const [info, setInfo] = useShallowState(update);
    useEffect(() => {

        const callback = (): void => {
            setInfo(update());
        };

        table.addListener('repaint', callback);

        return () => {
            table.removeListener('repaint', callback);
        };
    }, []);

    return {
        ...info,
        renderHead
    };
}
