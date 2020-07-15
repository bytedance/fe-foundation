/**
 * @file useYearPanel 获取年
 */

import {useShallowState} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {IYearPanelViewData, IYearPanelViewItem, PanelType} from '@co-hooks/date';
import {usePanel} from './usePanel';

export interface IYearPanelView extends IYearPanelViewData {
    setCurrentYear: (year: IYearPanelViewItem) => void;
    setCurrentYearVirtual: (year: IYearPanelViewItem) => void;
    prevTenYear: () => void;
    nextTenYear: () => void;
}

export function useYearView(part: string): IYearPanelView {

    const panel = usePanel(part);
    const yearView = panel.getYearPanel();
    const setCurrentYear = useCallback((year: IYearPanelViewItem) => {

        yearView.setCurrentYear(year);

        // 当前不在主视图里面，进行跳转
        if (panel !== yearView) {
            panel.setCurrentType(PanelType.MONTH);
        }

    }, []);
    const setCurrentYearVirtual = useCallback((year: IYearPanelViewItem) => {
        yearView.setCurrentYear(year, true);
    }, []);
    const prevTenYear = useCallback(() => panel.prevTenYear(), []);
    const nextTenYear = useCallback(() => panel.nextTenYear(), []);
    const update = (): IYearPanelViewData => panel.getYearPanel().getYearPanelView();
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
        setCurrentYear,
        setCurrentYearVirtual,
        prevTenYear,
        nextTenYear
    };
}
