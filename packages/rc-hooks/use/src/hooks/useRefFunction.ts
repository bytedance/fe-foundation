/**
 * @file useRefFunction 引用获取
 */

import {useCallback} from 'react';
import {FunctionAny, FunctionParams} from '@co-hooks/util';
import {useRefGetter} from './useRefGetter';

export function useRefFunction<T extends FunctionAny>(callback: T): T;
export function useRefFunction<T extends FunctionAny>(
    callback: T | undefined,
    defaultFunc?: T
): T;
export function useRefFunction<T extends FunctionAny>(
    callback: T | undefined,
    defaultFunc?: T
): (...args: FunctionParams<T>) => ReturnType<T> | void {
    const refGetter = useRefGetter(callback);
    const defaultGetter = useRefGetter(defaultFunc);

    return useCallback((...args: FunctionParams<T>): ReturnType<T> => {
        const fn = refGetter();
        const fnDefault = defaultGetter() as T;

        return fn ? fn(...args) : fnDefault(...args);
    }, []);
}
