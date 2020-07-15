/**
 * @file useCascaderActive 获取激活路径信息
 */

import {clone} from '@co-hooks/util';
import {useUpdate} from "@rc-hooks/use";
import {useEffect} from 'react';
import {useCascader} from './useCascader';

export function useCascaderActive(): string[] {

    const cascader = useCascader();
    const update = useUpdate();

    useEffect(() => {

        cascader.addListener('active-change', update);

        return () => {
            cascader.removeListener('active-change', update);
        };
    });

    return clone(cascader.getActiveIds());
}
