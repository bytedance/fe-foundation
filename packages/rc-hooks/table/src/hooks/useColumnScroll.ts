/**
 * @file useScroll
 */
import {IColumnScrollInfo} from '@co-hooks/table';
import {useRefCallback} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {useTable} from './useTable';

export function useColumnScroll(
    onUpdateScroll?: (scroll: number) => void
): [number, (value: number, delta?: boolean) => void] {

    const table = useTable();
    const manager = table.getLeafColumnManager();
    const onUpdateScrollCallback = useRefCallback(onUpdateScroll);

    const onChange = useCallback((value: number, delta?: boolean) => {
        manager.updateNonFixedScroll(value + (delta ? Number(manager.getNonFixedScroll()) : 0));
    }, []);

    useEffect(() => {

        const callback = (info: IColumnScrollInfo): void => {
            onUpdateScrollCallback(info.scroll);
        };

        manager.addListener('scroll', callback);

        return () => manager.removeListener('scroll', callback);
    }, []);

    return [manager.getColumnScrollInfo().scroll, onChange];
}
