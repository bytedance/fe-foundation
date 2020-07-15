/**
 * @file useIsGroup 判断列是否为分组
 */

import {useTable} from './useTable';

export function useIsGroup(id: string): boolean | null {

    const table = useTable();
    const columnManager = table.getColumnManager();
    const column = columnManager.getColumn(id);

    // 不存在丢出错误
    if (column == null) {
        throw new Error('invalid column key = ' + id);
    }

    return column.isGroup();
}
