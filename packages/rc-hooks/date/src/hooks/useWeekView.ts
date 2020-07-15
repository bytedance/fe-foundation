/**
 * @file useWeekPanel 获取周面板
 */

import {useCallback, useEffect} from 'react';
import {IWeekPanelViewData, IWeekPanelViewItem, PanelType} from '@co-hooks/date';
import {useShallowState} from '@rc-hooks/use';
import {usePanel} from './usePanel';

export interface IWeekPanelView extends IWeekPanelViewData {
    setCurrentWeek: (week: IWeekPanelViewItem) => void;
    setCurrentWeekVirtual: (week: IWeekPanelViewItem) => void;
    prevYear: () => void;
    nextYear: () => void;
    prevMonth: () => void;
    nextMonth: () => void;
    changeToYear: () => void;
    changeToMonth: () => void;
}

export function useWeekView(part: string): IWeekPanelView {

    const panel = usePanel(part);
    const weekView = panel.getWeekPanel();
    const changeToYear = useCallback(() => panel.setCurrentType(PanelType.YEAR), []);
    const changeToMonth = useCallback(() => panel.setCurrentType(PanelType.MONTH), []);
    const prevYear = useCallback(() => panel.prevYear(), []);
    const nextYear = useCallback(() => panel.nextYear(), []);
    const prevMonth = useCallback(() => panel.prevMonth(), []);
    const nextMonth = useCallback(() => panel.nextMonth(), []);
    const setCurrentWeek = useCallback((week: IWeekPanelViewItem) => {

        weekView.setCurrentWeek(week);

        // 当前不在主面板里面，进行面板跳转
        if (panel !== weekView) {

            // 根据是Week还是Date进行跳转
            panel.setCurrentType(panel.getPanelType());
        }

    }, []);

    const setCurrentWeekVirtual = useCallback((week: IWeekPanelViewItem) => {
        weekView.setCurrentWeek(week, true);
    }, []);

    const update = (): IWeekPanelViewData => panel.getWeekPanel().getDatePanelView();
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
        setCurrentWeek,
        setCurrentWeekVirtual,
        nextYear,
        prevYear,
        prevMonth,
        nextMonth,
        changeToYear,
        changeToMonth
    };
}
