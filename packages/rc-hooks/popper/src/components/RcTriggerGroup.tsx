/**
 * @file RcTriggerGroup
 */
import React from 'react';
import {TriggerGroup} from '@co-hooks/popper';
import {useSingleton} from '@rc-hooks/use';
import {TriggerGroupContext} from '../context/TriggerGroup';
import {useGetPopper} from '../hooks/useGetPopper';
import {useTriggerGroup} from '../hooks/useTriggerGroup';

export interface IRcTriggerGroup {
    triggerGroupId?: string;
    children?: React.ReactNode;
}

export type IRcTriggerGroupProps = IRcTriggerGroup;

export function RcTriggerGroup(props: IRcTriggerGroupProps): JSX.Element {
    const {triggerGroupId, children} = props;

    const popper = useGetPopper();
    const triggerGroup = useTriggerGroup();

    const group = useSingleton(() => new TriggerGroup(popper, triggerGroup, triggerGroupId));

    return (
        <TriggerGroupContext.Provider value={group}>
            {children}
        </TriggerGroupContext.Provider>
    );
}
