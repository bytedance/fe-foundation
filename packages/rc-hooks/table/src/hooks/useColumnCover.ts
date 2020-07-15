/**
 * @file useColumnCover 判断是否滚动覆盖
 */
import {IColumnScrollInfo} from '@co-hooks/table';
import {useRefGetter} from '@rc-hooks/use';
import {useEffect, useState} from 'react';
import {useTable} from './useTable';

export function useColumnCover(position: 'left' | 'right'): boolean {

    const positionGetter = useRefGetter(position);
    const table = useTable();
    const manager = table.getLeafColumnManager();
    const [fixed, setFixed] = useState(() => {
        const p = positionGetter();
        const info = manager.getColumnScrollInfo();
        return p === 'left' ? info.isFixedLeftCover : info.isFixedRightCover;
    });

    useEffect(() => {

        const callback = (info: IColumnScrollInfo): void => {
            const p = positionGetter();
            setFixed(p === 'left' ? info.isFixedLeftCover : info.isFixedRightCover);
        };

        manager.addListener('scroll', callback);

        return () => manager.removeListener('scroll', callback);
    }, []);

    return fixed;
}
