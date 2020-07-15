/**
 * @file useCascader 获取级联的操作对象
 */

import {useContext} from 'react';
import {ICascader} from '@co-hooks/tree';
import {CascaderContext} from '../context/cascader';

export function useCascader<T, P>(): ICascader<T, P> {

    const cascader = useContext<ICascader<T, P> | null>(CascaderContext);

    if (cascader == null) {
        throw new Error('useCascader must be use under RcCascader');
    }

    return cascader;
}
