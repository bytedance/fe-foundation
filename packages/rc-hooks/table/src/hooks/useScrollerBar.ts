/**
 * @file useScrollerBar
 */
import {IColumnScrollInfo, useTable} from '@rc-hooks/table';
import {useRefCallback, useShallowState} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';

export interface IScrollerBarInfo {
    scroll: number;
    width: number;
    scrollerWidth: number;
    onScrollChange: (value: number) => void;
}

export function useScrollerBar(
    onScroll?: (value: number) => void
): IScrollerBarInfo {
    const table = useTable();
    const manager = table.getLeafColumnManager();
    const onScrollCallback = useRefCallback(onScroll);
    const onScrollChange = useCallback((value: number) => {
        manager.updateNonFixedScroll(value);
    }, []);

    const update = (): Omit<IScrollerBarInfo, 'onScrollChange'> => {

        const sizeInfo = manager.getColumnSizeInfo();

        return {
            width: sizeInfo.tableWidth,
            scrollerWidth: sizeInfo.fixedLeftWidth + sizeInfo.fixedRightWidth + sizeInfo.scrollerWidth,
            scroll: manager.getColumnScrollInfo().scroll
        };
    };

    const [info, setInfo] = useShallowState(update);

    useEffect(() => {

        const callback = (info: IColumnScrollInfo): void => {
            onScrollCallback(info.scroll);
        };

        const updateSize = (): void => {
            setInfo(update());
        };

        manager.addListener('size', updateSize);
        manager.addListener('scroll', callback);

        return () => {
            manager.removeListener('scroll', callback);
            manager.removeListener('size', updateSize);
        };
    }, []);

    return {
        ...info,
        onScrollChange
    };
}
