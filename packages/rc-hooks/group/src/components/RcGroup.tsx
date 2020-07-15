/**
 * @file RcGroup
 */

import {UnionOmit} from '@co-hooks/util';
import {useSingleton} from '@rc-hooks/use';
import React, {HTMLAttributes, useEffect} from 'react';
import {Group, IGroupOptions} from '@co-hooks/group';
import {GroupContext} from '../context/group';

export type IRcGroupProps<T, P> = UnionOmit<IGroupOptions<T, P>, HTMLAttributes<HTMLDivElement>>;

export function RcGroup<T, P>(props: IRcGroupProps<T, P>): JSX.Element {

    const group = useSingleton(() => new Group<T, P>(props));

    // 把剩余项目处理放在里面有
    const extra = group.updateGroupOptions(props);

    useEffect(() => () => group.dispose(), []);

    return (
        <GroupContext.Provider value={group}>
            <div {...extra} />
        </GroupContext.Provider>
    );
}
