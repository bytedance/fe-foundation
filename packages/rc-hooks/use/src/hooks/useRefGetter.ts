/**
 * @file useRefGetter 引用获取
 */

import {useCallback, useRef} from 'react';

export function useRefGetter<T>(value: T): () => T {

    const ref = useRef(value);

    ref.current = value;

    return useCallback(() => ref.current, []);
}
