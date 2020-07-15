/**
 * @file useCreateSchedule
 */
import {useEffect} from 'react';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {IRcScheduleBaseOptions, IScheduleValue, Schedule} from '@co-hooks/schedule';

export interface IRcScheduleOptions extends IRcScheduleBaseOptions {
    onValueChange?: (value: IScheduleValue[]) => void;
    value?: IScheduleValue[];
}

export interface IUseCreateScheduleResult {
    schedule: Schedule;
}

export function useCreateSchedule(options: IRcScheduleOptions): IUseCreateScheduleResult {
    const schedule = useSingleton(() => new Schedule());
    const {
        value = [],
        onValueChange,
        ...extra
    } = options;

    schedule.updateOptions(extra);
    schedule.updateValue(value);

    const onValueChangeCallback = useRefCallback(onValueChange);

    useEffect(() => {
        schedule.addListener('value-change', onValueChangeCallback);

        return () => {
            schedule.removeListener('value-change', onValueChangeCallback);
        };
    }, []);

    return {
        schedule
    };
}
