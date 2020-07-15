/**
 * @file useCreateHotKey
 */
import {HotKey} from '@co-hooks/hotkey';
import {RefObject, useEffect, useRef} from 'react';
import {useContainer} from '@rc-hooks/dom';
import {useSingleton} from '@rc-hooks/use';

export function useCreateHotKey(ele: RefObject<HTMLElement> | HTMLElement | null): HotKey {
    const elemGetter = useContainer(ele);
    const prevElemRef = useRef<HTMLElement | null>(null);
    const hotkey = useSingleton(() => new HotKey());

    useEffect(() => {
        const elem = elemGetter();
        if (elem !== prevElemRef.current) {
            prevElemRef.current = elem;

            if (elem) {
                hotkey.init(elem);
            } else {
                hotkey.dispose();
            }
        }
    });

    return hotkey;
}
