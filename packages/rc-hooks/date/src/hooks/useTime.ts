/**
 * @file useTime
 */

import {useContext} from 'react';
import {Time} from '@co-hooks/date';
import {TimeContext} from '../context/time';

export function useTime(): Time {
    const time = useContext(TimeContext);

    if (time == null) {
        throw new Error('useTime must be use under RcTime');
    }

    return time;
}
