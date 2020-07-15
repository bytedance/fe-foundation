/**
 * @file useCascaderUnique 级联类组件(值唯一)
 */

import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {useEffect} from 'react';
import {Cascader, ICascaderOptions} from '@co-hooks/tree';

export interface IUseCascaderUniqueResult<T, P> {
    cascader: Cascader<T, P>;
}

export function useCreateCascader<T, P>(
    options: ICascaderOptions<T, P>
): IUseCascaderUniqueResult<T, P> {

    const {onChange, onExpand, ...extra} = options;
    const cascader = useSingleton(() => new Cascader<T, P>());

    cascader.updateCascader({...extra});

    const handleChange = useRefCallback(onChange);
    const handleExpand = useRefCallback(onExpand);

    useEffect(() => {
        cascader.addListener('change', handleChange);
        cascader.addListener('expanded', handleExpand);

        return () => {
            cascader.removeListener('change', handleChange);
            cascader.removeListener('expanded', handleExpand);
            cascader.dispose();
        };
    }, []);

    return {
        cascader
    };
}
