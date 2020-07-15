/**
 * @file useCombineRef
 */
import {Ref, RefObject, useLayoutEffect, useRef} from 'react';

export function useCombineRef<T>(...refs: Array<Ref<T> | undefined>): RefObject<T> {

    const ref = useRef<T>(null);

    // 每一次useLayoutEffect都同步，用useLayoutEffect来同步执行，以希望比useEffect更早
    useLayoutEffect(() => {

        refs.forEach(item => {

            if (item == null) {
                return;
            }

            if (typeof item === 'function') {
                item(ref.current);
            } else {
                Object.assign(item, {current: ref.current});
            }
        });
    });

    return ref;
}
