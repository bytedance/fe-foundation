/**
 * @file usePrevProp 保存之前的属性
 */

import {useRef} from 'react';
import {EqualFunction, equal} from '@co-hooks/util';

export function usePrevProp<T>(prop: T, comparator?: EqualFunction<T>): [boolean, T] {

    const prev = useRef<T>(prop);
    const old = prev.current;
    const isEqual = (comparator || equal)(old, prop);
    prev.current = prop;

    return [isEqual, old];
}
