/**
 * @file usePartialUpdate 生成一个部分更新对象的函数
 */

import {useCallback} from 'react';
import {useRefGetter} from './useRefGetter';

export function usePartialUpdate<S>(value: S, onChange: (value: S) => void): (value: Partial<S>) => void {

    const getter = useRefGetter({value, onChange});

    return useCallback((nv: Partial<S>) => {
        const {value, onChange} = getter();
        onChange({...value, ...nv});
    }, []);
}
