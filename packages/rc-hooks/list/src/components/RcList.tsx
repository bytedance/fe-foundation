/**
 * @file RcList 虚拟滚动列表
 */

import {useSingleton} from '@rc-hooks/use';
import React from 'react';
import {IListOptions, List} from '../lib/List';
import {ListContext} from '../context/list';

export type IRcListProps = IListOptions & {children?: React.ReactNode};

export function RcList(props: IRcListProps): JSX.Element {

    const list = useSingleton(() => new List());
    const {children, ...options} = props;

    list.updateListOptions(options);

    return (
        <ListContext.Provider value={list}>
            {children}
        </ListContext.Provider>
    );
}
