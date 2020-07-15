/**
 * @file useCascaderRoot 获取根节点
 */

import {ITreeMapHashItem} from '@co-hooks/tree-map';
import {ICascaderData} from '@co-hooks/cascader';
import {useCascader} from './useCascader';
import {useCascaderItem} from './useCascaderItem';

export function useCascaderRoot<T>(): ITreeMapHashItem<T, ICascaderData<T>> {

    const cascader = useCascader<T>();
    const rootId = cascader.getRootId();

    return useCascaderItem(rootId);
}
