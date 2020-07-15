/**
 * @file useColumnSize 获取表格列宽
 */

import {IColumnSizeInfo} from '@co-hooks/table';
import {useShallowState} from '@rc-hooks/use';
import {useEffect} from 'react';
import {useTable} from './useTable';

export function useColumnSize(): IColumnSizeInfo {

    const table = useTable();
    const manager = table.getLeafColumnManager();
    const [info, setInfo] = useShallowState(() => manager.getColumnSizeInfo());

    useEffect(() => {

        manager.addListener('size', setInfo);

        return () => {
            manager.removeListener('size', setInfo);
        };
    }, []);

    return info;
}
