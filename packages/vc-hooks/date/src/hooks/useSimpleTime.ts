/**
 * @file useSimpleTime
 */

import {Time} from '@co-hooks/date';
import {onBeforeMount, onBeforeUnmount, provide} from '@vue/composition-api';
import {TimeContext} from '../context/time';

export interface ISimpleTimeOptions {
    part: string;
    onChange: (value: Date) => void;
}

export function useSimpleTime(options: ISimpleTimeOptions): Time {
    const {part, onChange} = options;
    const root = new Time(part);

    provide(TimeContext, root);

    onBeforeMount(() => root.addListener('value-change', onChange));
    onBeforeUnmount(() => root.removeListener('value-change', onChange));

    return root;
}
