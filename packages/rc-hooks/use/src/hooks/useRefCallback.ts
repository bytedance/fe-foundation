/**
 * @file useRefGetter 引用获取
 */

import {useCallback} from 'react';
import {FunctionAny, FunctionParams} from '@co-hooks/util';
import {useRefGetter} from './useRefGetter';

export function useRefCallback<T extends FunctionAny>(callback?: T): (...args: FunctionParams<T>) => void {

    const refGetter = useRefGetter(callback);

    return useCallback((...args: FunctionParams<T>) => {
        const fn = refGetter();
        return fn && fn(...args);
    }, []);
}
