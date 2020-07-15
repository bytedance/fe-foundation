/**
 * @file useCascader 获取级联的操作对象
 */

import {useContext} from 'react';
import {Cascader} from '@co-hooks/cascader';
import {CascaderContext} from '../context/cascader';

export function useCascader<T>(): Cascader<T> {

    const cascader = useContext<Cascader<T> | null>(CascaderContext);

    if (cascader == null) {
        throw new Error('useCascader must be use under RcCascader');
    }

    return cascader;
}
