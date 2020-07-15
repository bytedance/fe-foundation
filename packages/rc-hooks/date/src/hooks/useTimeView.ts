/**
 * @file useTimeView
 */

import {useUpdate} from '@rc-hooks/use';
import {useContext, useEffect} from 'react';
import {Time} from '@co-hooks/date';
import {RangeTimeContext} from '../context/rangeTime';
import {useTime} from './useTime';

export function useTimeView(): Time {
    const update = useUpdate();
    const time = useTime();
    // inject rangeTime
    const rangeTime = useContext(RangeTimeContext);
    time.root = rangeTime;

    useEffect(() => {
        time.addListener('repaint', update);
        return () => time.removeListener('repaint', update);
    }, []);

    return time;
}
