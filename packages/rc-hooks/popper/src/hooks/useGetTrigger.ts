/**
 * @file useGetTrigger
 */
import {ITrigger} from '@co-hooks/popper';
import {useGetPopper} from './useGetPopper';

export function useGetTrigger<T>(triggerId: string): ITrigger<T> {

    if (!triggerId) {
        throw new Error('useGetTrigger must have triggerId param');
    }

    const popper = useGetPopper<T>();

    return popper.getTrigger(triggerId);
}
