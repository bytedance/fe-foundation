/**
 * @file useSchedulePanel
 */
import {useCallback, useEffect} from 'react';
import {useSingleton, useUpdate} from '@rc-hooks/use';
import {IScheduleDisplayInfo, IScheduleList, IScheduleValue, SchedulePanel} from '@co-hooks/schedule';
import {useSchedule} from './useSchedule';

export interface IUseSchedulePanelResult {
    divider: number;
    datasource: string[];
    scheduleList: IScheduleList[];
    displayInfo: IScheduleDisplayInfo[];
    onClearAll: () => void;
    onSetValue: (value: IScheduleValue[]) => void;
}

export function useSchedulePanel(): IUseSchedulePanelResult {
    const schedule = useSchedule();
    const panel = useSingleton(() => new SchedulePanel(schedule));
    const update = useUpdate();

    useEffect(() => {
        schedule.addListener('repaint-panel', update);

        return () => {
            schedule.removeListener('repaint-panel', update);
        };
    }, []);

    const handleSetValue = useCallback((val: IScheduleValue[]) => {
        schedule.setValue(val);
    }, []);

    const handleClearAll = useCallback(() => {
        schedule.clearValue();
    }, []);

    return {
        datasource: schedule.getDatasource(),
        divider: schedule.getDivider(),
        scheduleList: panel.getScheduleList(),
        displayInfo: schedule.getDisplayInfo(),
        onClearAll: handleClearAll,
        onSetValue: handleSetValue
    };
}
