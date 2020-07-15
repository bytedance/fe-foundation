/**
 * @file useHead 获取表头渲染信息
 */

import {useShallowState} from '@rc-hooks/use';
import {useEffect} from 'react';
import {useTable} from './useTable';

export interface ITableHeadInfo {
    deep: number;
    fixedLeftColumns: string[];
    nonFixedColumns: string[];
    fixedRightColumns: string[];
}

export function useHead(): ITableHeadInfo {

    const table = useTable();
    const columnManager = table.getColumnManager();
    const leafColumnManager = table.getLeafColumnManager();

    const update = (): ITableHeadInfo => ({
        deep: leafColumnManager.getHeadDeep(),
        fixedLeftColumns: columnManager.getFixedLeftColumns(),
        fixedRightColumns: columnManager.getFixedRightColumns(),
        nonFixedColumns: columnManager.getNonFixedColumns()
    });

    const [info, setInfo] = useShallowState(update);

    useEffect(() => {

        const repaint = (): void => setInfo(update());

        table.addListener('repaint', repaint);

        return () => table.removeListener('repaint', repaint);
    }, []);

    return info;
}
