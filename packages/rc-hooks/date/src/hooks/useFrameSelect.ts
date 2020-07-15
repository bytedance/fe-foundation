/**
 * @file useFrameSelect
 */
import {FrameSelectedType} from '@co-hooks/date';
import {useCallback} from 'react';
import {usePanel} from './usePanel';

export interface IFrameSelectInfo {
    frameSelectDate: (data: Date[], type: FrameSelectedType) => void;
    frameSelectDateVirtual: (data: Date[], type: FrameSelectedType) => void;
}

export function useFrameSelect(part: string): IFrameSelectInfo {

    const panel = usePanel(part);

    const frameSelectDate = useCallback((date: Date[], type: FrameSelectedType) => {
        panel.frameSelectDate(date, type);

    }, []);

    const frameSelectDateVirtual = useCallback((date: Date[], type: FrameSelectedType) => {
        panel.frameSelectDate(date, type, true);
    }, []);

    return {
        frameSelectDate,
        frameSelectDateVirtual
    };
}
