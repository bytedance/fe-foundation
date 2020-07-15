/**
 * @file useCascaderRoot 获取根节点
 */

import {IHashMapItem} from '@co-hooks/tree';
import {useCascader} from './useCascader';
import {useCascaderItem} from './useCascaderItem';

export function useCascaderRoot<T, P>(): IHashMapItem<T, P> {

    const cascader = useCascader<T, P>();
    const rootId = cascader.getRootId();

    return useCascaderItem(rootId);
}
