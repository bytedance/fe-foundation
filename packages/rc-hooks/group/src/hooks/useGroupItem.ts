/**
 * @file useGroupItem
 */

import {useSingleton, useUpdate} from '@rc-hooks/use';
import {useContext, useEffect} from 'react';
import {GroupItem, IGroupItemOptions, IGroupItemRenderProps} from '@co-hooks/group';
import {GroupContext} from '../context/group';

export function useGroupItem<T, P>(props: IGroupItemOptions<T, P>): IGroupItemRenderProps<T, P> {

    const update = useUpdate();
    const groupInfo = useContext(GroupContext);

    if (groupInfo == null) {
        throw new Error('use RcGroupItem not in RcGroup');
    }

    const itemInfo = useSingleton(() => new GroupItem<T, P>(groupInfo, props));
    const conf = itemInfo.getGroupItemInfo(props);

    useEffect(() => {

        itemInfo.addListener('group-change', update);

        return () => {
            itemInfo.removeListener('group-change', update);
            itemInfo.dispose();
        };
    }, [itemInfo]);

    return conf;
}
