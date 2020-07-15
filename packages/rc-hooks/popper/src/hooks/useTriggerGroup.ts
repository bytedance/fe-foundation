/**
 * @file useTriggerGroup
 */
import {useContext} from 'react';
import {TriggerGroup} from '@co-hooks/popper';
import {TriggerGroupContext} from '../context/TriggerGroup';

export function useTriggerGroup<T>(): TriggerGroup<T> | undefined {

    const triggerGroup = useContext(TriggerGroupContext);

    if (triggerGroup == null) {
        return undefined;
    }

    return triggerGroup as TriggerGroup<T>;
}
