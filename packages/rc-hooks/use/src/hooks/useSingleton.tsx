/**
 * @file useSingleton 单例模式（用于解决useMemo在一定程度上不安全的问题）
 */
import {useMemo, useRef} from 'react';

export function useSingleton<T>(creator: () => T): T {

    const ref = useRef<T | null>(null);

    return useMemo(() => {

        if (ref.current) {
            return ref.current;
        }

        return ref.current = creator();
    }, []);
}
