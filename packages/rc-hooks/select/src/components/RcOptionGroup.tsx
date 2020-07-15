/**
 * @file RcOptionGroup
 */

import React, {useEffect} from 'react';
import {IOptionGroupOptions, OptionGroup} from '@co-hooks/select';
import {useSingleton} from '@rc-hooks/use';
import {OptionGroupContext} from '../context/optionGroup';
import {useOptionGroup} from '../hooks/useOptionGroup';
import {useSelect} from '../hooks/useSelect';

export interface IRcOptionGroup {
    groupId?: string;
    children?: React.ReactNode;
}

export type IRcOptionGroupProps = IOptionGroupOptions & IRcOptionGroup;

export function RcOptionGroup(props: IRcOptionGroupProps): JSX.Element {
    const {children, title, groupId} = props;
    const select = useSelect();
    const optionGroup = useOptionGroup();

    const group = useSingleton(() => new OptionGroup(select, groupId, optionGroup || undefined));

    useEffect(() => {
        group.updateOptionGroupOptions({title});
    });

    useEffect(() => () => {
        group.dispose();
    }, []);

    return (
        <OptionGroupContext.Provider value={group}>
            {children}
        </OptionGroupContext.Provider>
    );
}
