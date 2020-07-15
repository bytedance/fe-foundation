/**
 * @file useScroll 监测元素滚动
 */

import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {useEffect} from 'react';
import {addMutationHandler, isClient, removeMutationHandler} from '@co-hooks/dom';

export type ScrollHandler = (e: Event) => void;

export function useScroll(
    enable: () => boolean,
    onScroll: VoidFunction
): void {

    const onScrollCallback = useRefCallback(onScroll);
    const enableGetter = useRefGetter(enable);

    useEffect(() => {
        const callback = (): void => {

            if (enableGetter()()) {
                onScrollCallback();
            }
        };

        if (isClient()) {

            addMutationHandler(callback, {
                scroll: true
            });

            return () => {
                removeMutationHandler(callback);
            };
        }

    }, []);
}
