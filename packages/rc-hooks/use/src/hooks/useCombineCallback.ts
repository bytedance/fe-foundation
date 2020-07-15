/**
 * @file useCombineCallback
 */
import {FunctionAny, FunctionParams} from '@co-hooks/util';
import {useCallback} from 'react';
import {useRefGetter} from './useRefGetter';

export function useCombineCallback<T extends FunctionAny>(
    ...callbacks: Array<T | undefined>
): (...args: FunctionParams<T>) => void {

    const refGetter = useRefGetter(callbacks);

    return useCallback((...args: FunctionParams<T>) => {
        const fns = refGetter();

        fns.forEach(fn => {
            fn && fn(...args);
        });
    }, []);
}
