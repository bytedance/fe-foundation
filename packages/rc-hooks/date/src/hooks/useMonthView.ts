/**
 * @file useMonthPanel 获取月面板
 */

import {useShallowState} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {IMonthPanelViewData, IMonthPanelViewItem, PanelType} from '@co-hooks/date';
import {usePanel} from './usePanel';

export interface IMonthPanelView extends IMonthPanelViewData {
    setCurrentMonth: (month: IMonthPanelViewItem) => void;
    setCurrentMonthVirtual: (month: IMonthPanelViewItem) => void;
    prevYear: () => void;
    nextYear: () => void;
    changeToYear: () => void;
}

export function useMonthView(part: string): IMonthPanelView {

    const panel = usePanel(part);
    const monthView = panel.getMonthPanel();
    const changeToYear = useCallback(() => panel.setCurrentType(PanelType.YEAR), []);
    const prevYear = useCallback(() => panel.prevYear(), []);
    const nextYear = useCallback(() => panel.nextYear(), []);
    const setCurrentMonth = useCallback((month: IMonthPanelViewItem) => {

        monthView.setCurrentMonth(month);

        // 当前不在主面板里面，进行面板跳转
        if (panel !== monthView) {

            // 根据是Week还是Date进行跳转
            panel.setCurrentType(panel.getPanelType());
        }

    }, []);

    const setCurrentMonthVirtual = useCallback((month: IMonthPanelViewItem) => {
        monthView.setCurrentMonth(month, true);
    }, []);

    const update = (): IMonthPanelViewData => panel.getMonthPanel().getMonthPanelView();
    const [viewer, setViewer] = useShallowState(update);

    useEffect(() => {

        const callback = (): void => {
            setViewer(update());
        };

        panel.addListener('repaint', callback);

        return () => panel.removeListener('repaint', callback);
    }, [panel]);

    return {
        ...viewer,
        setCurrentMonth,
        setCurrentMonthVirtual,
        nextYear,
        prevYear,
        changeToYear
    };
}
