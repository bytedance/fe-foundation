/**
 * @file useCascaderItem 获取级联的节点信息
 */
import {useRefGetter, useUpdate} from '@rc-hooks/use';
import {useEffect} from 'react';
import {Cascader, IHashMapItem} from '@co-hooks/tree';
import {useCascader} from './useCascader';

export function useCascaderItem<T, P>(id: string): IHashMapItem<T, P> {

    const cascader = useCascader<T, P>() as Cascader<T, P>;
    const idGetter = useRefGetter(id);
    const update = useUpdate();
    const info = cascader.getItemInfo(id) || {};
    const stateGetter = useRefGetter(info.state);

    useEffect(() => {

        // loading的变化，一定要重新刷新
        const loadingCallback = (cid: string): void => {

            if (cid !== idGetter()) {
                return;
            }

            update();
        };

        const changeCallback = (): void => {

            if (info.state === stateGetter()) {
                return;
            }

            update();
        };

        let cleared = false;

        // 添加一个解绑逻辑，当重置
        const resetCallback = (): void => {

            if (cleared) {
                return;
            }

            cleared = true;
            cascader.removeListener('value-change', changeCallback);
            cascader.removeListener('item-loading', loadingCallback);
            cascader.removeListener('reset', resetCallback);
        };

        cascader.addListener('value-change', changeCallback);
        cascader.addListener('item-loading', loadingCallback);
        cascader.addListener('reset', resetCallback);

        return resetCallback;
    }, []);

    return info;
}
