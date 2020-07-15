/**
 * @file useSchedule
 */

import {useContext} from 'react';
import {Schedule} from '@co-hooks/schedule';
import {ScheduleContext} from '../context/schedule';

export function useSchedule(): Schedule {
    const schedule = useContext(ScheduleContext);

    if (!schedule) {
        throw new Error('useSchedule must under RcSchedule');
    }

    return schedule;
}
