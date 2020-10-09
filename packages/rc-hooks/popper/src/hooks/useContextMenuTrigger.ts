/**
 * @file useContextMenuTrigger
 */

import {RefObject, useCallback} from 'react';
import {ITriggerOptions, Trigger} from '@co-hooks/popper';
import {useGetPopper} from './useGetPopper';
import {useTrigger} from './useTrigger';

export function useContextMenuTrigger<T, W extends Omit<ITriggerOptions<T>, 'defaultTrigger'>>(
    options: W,
    triggerRef: RefObject<HTMLElement>
): [Trigger<T>, () => void, () => void] {

    const [trigger] = useTrigger<T, Trigger<T>, W>(
        (...args) => new Trigger(...args),
        {...options, defaultTrigger: true},
        triggerRef,
        'contextmenu'
    );

    const popper = useGetPopper();

    const showPopper = useCallback(() => {
        popper.showPopper(trigger.getId());
    }, []);

    const hidePopper = useCallback(() => {
        popper.hidePopper(trigger.getId());
    }, []);

    return [trigger, showPopper, hidePopper];
}
