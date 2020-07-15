/**
 * @file useCascaderItem 获取级联的节点信息
 */
import {useRefGetter, useUpdate} from '@rc-hooks/use';
import {useEffect} from 'react';
import {ICascaderHashItem} from '@co-hooks/cascader';
import {useCascader} from './useCascader';

export function useCascaderItem<T>(id: string): ICascaderHashItem<T> {

    const cascader = useCascader<T>();
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

        cascader.addListener('value-change', changeCallback);
        cascader.addListener('data-loading', loadingCallback);
        cascader.addListener('reset', update);

        return () => {
            cascader.removeListener('value-change', changeCallback);
            cascader.removeListener('data-loading', loadingCallback);
            cascader.removeListener('reset', update);
        };
    }, []);

    return info;
}
