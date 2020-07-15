/**
 * @file useList 获取虚拟滚动信息
 */

import {useContext} from 'react';
import {List} from '../lib/List';
import {ListContext} from '../context/list';

export function useList(): List {

    const context = useContext(ListContext);

    if (context == null) {
        throw new Error('use useList not in RcList');
    }

    return context;
}
