/**
 * @file useTime
 */

import {Time} from '@co-hooks/date';
import {inject} from '@vue/composition-api';
import {TimeContext} from '../context/time';

export function useTime(): Time {
    const context = inject<Time>(TimeContext);

    if (!context) {
        throw new Error('useTime must be use under RcTime');
    }

    return context;
}
