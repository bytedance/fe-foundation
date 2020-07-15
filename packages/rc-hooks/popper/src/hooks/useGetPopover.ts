/**
 * @file useGetPopover
 */
import {Popover} from '@co-hooks/popper';
import {useGetPopper} from './useGetPopper';

export function useGetPopover<T>(popoverId: string): Popover<T> {

    if (!popoverId) {
        throw new Error('useGetPopover must have popoverId param');
    }

    const popper = useGetPopper<T>();

    return popper.getPopover(popoverId);
}
