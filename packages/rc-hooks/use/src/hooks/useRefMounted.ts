/**
 * @file useRefGetter 引用获取
 */

import {useCallback, useEffect, useRef} from 'react';
import {useRefCallback} from './useRefCallback';

export function useRefMounted(onMounted?: (mounted: boolean) => void): () => boolean {

    const onMountedCallback = useRefCallback(onMounted);
    const ref = useRef(false);

    useEffect(() => {
        onMountedCallback(ref.current = true);

        return () => {
            onMountedCallback(ref.current = false);
        };
    }, []);

    return useCallback(() => ref.current, []);
}
