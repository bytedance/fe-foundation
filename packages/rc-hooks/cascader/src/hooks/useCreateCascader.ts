/**
 * @file useCascaderUnique 级联类组件(值唯一)
 */

import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {useEffect} from 'react';
import {Cascader, ICascaderOptions} from '@co-hooks/cascader';

export interface IUseCascaderUniqueResult<T> {
    cascader: Cascader<T>;
}

export function useCreateCascader<T>(options: ICascaderOptions<T>): IUseCascaderUniqueResult<T> {

    const {onChange, ...extra} = options;
    const cascader = useSingleton(() => new Cascader<T>());

    cascader.updateCascader({...extra});

    const handleChange = useRefCallback(onChange);

    useEffect(() => {
        cascader.addListener('change', handleChange);

        return () => {
            cascader.removeListener('change', handleChange);
            cascader.dispose();
        };
    }, []);

    return {
        cascader
    };
}
