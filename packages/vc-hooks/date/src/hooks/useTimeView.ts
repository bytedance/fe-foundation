/**
 * @file useTimeView
 */

import {ITimeItem, Time, TimeType} from '@co-hooks/date';
import {inject, onMounted, onUnmounted, reactive} from '@vue/composition-api';
import {RangeTimeContext} from '../context/rangTime';
import {useTime} from './useTime';

export interface IDataType {
    hourOptions: ITimeItem[];
    minuteOptions: ITimeItem[];
    secondOptions: ITimeItem[];
    hourActiveIndex: number;
    minuteActiveIndex: number;
    secondActiveIndex: number;
}

export function useTimeView(): { time: Time; data: IDataType} {
    const time = useTime();
    const data = reactive<IDataType>({
        hourOptions: [],
        minuteOptions: [],
        secondOptions: [],
        hourActiveIndex: 0,
        minuteActiveIndex: 0,
        secondActiveIndex: 0
    });

    // inject rangeTime
    const rangeTime = inject(RangeTimeContext, null);
    time.root = rangeTime;

    const update = (): void => {
        data.hourOptions = time.getHourOptions() as any;
        data.minuteOptions = time.getMinuteOptions() as any;
        data.secondOptions = time.getSecondOptions() as any;
        data.hourActiveIndex = time.getCurrentIndex(TimeType.HOUR, data.hourOptions as any);
        data.minuteActiveIndex = time.getCurrentIndex(TimeType.MINUTE, data.minuteOptions as any);
        data.secondActiveIndex = time.getCurrentIndex(TimeType.SECOND, data.secondOptions as any);
    };

    onMounted(() => time.addListener('repaint', update));
    onUnmounted(() => time.removeListener('repaint', update));

    return {
        time,
        data: data as any
    };
}
