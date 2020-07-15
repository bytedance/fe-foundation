/**
 * @file useDatePanel 获取日期面板
 */

import {useShallowState} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {IDatePanelViewData, IDatePanelViewItem, PanelType} from '@co-hooks/date';
import {usePanel} from './usePanel';

export interface IDatePanelView extends IDatePanelViewData {
    setCurrentDate: (Date: IDatePanelViewItem) => void;
    setCurrentDateVirtual: (Date: IDatePanelViewItem) => void;
    prevYear: () => void;
    nextYear: () => void;
    prevMonth: () => void;
    nextMonth: () => void;
    changeToYear: () => void;
    changeToMonth: () => void;
}

export function useDateView(part: string): IDatePanelView {

    const panel = usePanel(part);
    const dateView = panel.getDatePanel();
    const changeToYear = useCallback(() => panel.setCurrentType(PanelType.YEAR), []);
    const changeToMonth = useCallback(() => panel.setCurrentType(PanelType.MONTH), []);
    const prevYear = useCallback(() => panel.prevYear(), []);
    const nextYear = useCallback(() => panel.nextYear(), []);
    const prevMonth = useCallback(() => panel.prevMonth(), []);
    const nextMonth = useCallback(() => panel.nextMonth(), []);

    const update = (): IDatePanelViewData => panel.getDatePanel().getDatePanelView();
    const [viewer, setViewer] = useShallowState(update);

    useEffect(() => {

        const callback = (): void => {
            setViewer(update());
        };

        panel.addListener('repaint', callback);

        return () => panel.removeListener('repaint', callback);
    }, [panel]);

    const setCurrentDate = useCallback((date: IDatePanelViewItem) => {

        dateView.setCurrentDate(date);

        // 当前不在主面板里面，进行面板跳转
        if (panel !== dateView) {

            // 根据是Week还是Date进行跳转
            panel.setCurrentType(panel.getPanelType());
        }

    }, []);

    const setCurrentDateVirtual = useCallback((date: IDatePanelViewItem) => {
        dateView.setCurrentDate(date, true);
    }, []);

    return {
        ...viewer,
        setCurrentDate,
        setCurrentDateVirtual,
        nextYear,
        prevYear,
        prevMonth,
        nextMonth,
        changeToYear,
        changeToMonth
    };
}
