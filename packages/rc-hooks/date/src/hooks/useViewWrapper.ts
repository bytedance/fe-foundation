/**
 * @file usePanel 获取支持面板和当前面板
 */

import {useShallowState} from '@rc-hooks/use';
import {useEffect} from 'react';
import {PanelType} from '@co-hooks/date';
import {useDate} from './useDate';

export interface IViewWrapperInfo {
    ownerType: PanelType;
    currentPanelType: PanelType;
    isOwner: boolean;
    hidePrev: boolean;
    hideNext: boolean;
    invalid: boolean;
    disabled: boolean;
    outRangeDisabled: boolean;
}

export function useViewWrapper(part: string): IViewWrapperInfo {

    const date = useDate();
    const panel = date.getPanel(part);

    const update = (): IViewWrapperInfo => ({
        ownerType: panel.getPanelType(),
        currentPanelType: panel.getCurrentType(),
        isOwner: panel.getCurrentType() === panel.getPanelType(),
        hidePrev: panel.getHidePrev(),
        hideNext: panel.getHideNext(),
        disabled: date.isGlobalDisabled(),
        outRangeDisabled: panel.getOutRangeDisabled(),
        invalid: panel.isInvalidTryingDate()
    });

    const [viewer, setViewer] = useShallowState(update);

    useEffect(() => {

        const callback = (): void => {
            setViewer(update());
        };

        panel.addListener('repaint', callback);

        return () => panel.removeListener('repaint', callback);
    }, [panel]);

    return viewer;
}
