/**
 * @file useCascaderExpanded 获取激活路径信息
 */

import {clone} from '@co-hooks/util';
import {useUpdate} from '@rc-hooks/use';
import {useEffect} from 'react';
import {Cascader} from '@co-hooks/tree';
import {useCascader} from './useCascader';

export function useCascaderExpanded(): string[] {

    const cascader = useCascader() as Cascader<any, any>;
    const update = useUpdate();

    useEffect(() => {

        cascader.addListener('expanded-change', update);

        return () => {
            cascader.removeListener('expanded-change', update);
        };
    });

    return clone(cascader.getExpandedIds());
}
