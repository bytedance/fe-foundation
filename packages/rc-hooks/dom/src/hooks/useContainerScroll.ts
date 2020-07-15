/**
 * @file useScroll 监测元素滚动
 */

import {useRefGetter} from '@rc-hooks/use';
import {RefObject, useEffect, useRef} from 'react';
import {addEventListener, isClient, removeEventListener} from '@co-hooks/dom';
import {useContainer} from './useContainer';
import {ScrollHandler} from './useScroll';

export function useContainerScroll(
    element: HTMLElement | null | RefObject<HTMLElement>,
    enable: () => boolean,
    onScroll: ScrollHandler
): void {

    const onScrollGetter = useRefGetter(onScroll);
    const elementGetter = useContainer(element);
    const enableGetter = useRefGetter(enable);
    const initRef = useRef(false);
    const frame = useRef(0);

    useEffect(() => {

        if (!enableGetter()()) {
            return;
        }

        initRef.current = true;

        const callback = (e: Event): void => {

            cancelAnimationFrame(frame.current);

            frame.current = requestAnimationFrame(() => {

                const target = e.target as HTMLElement;
                const handler = onScrollGetter();
                const elem = elementGetter();

                // 当滚动时，强制刷新当前元素
                if (elem && target.contains(elem)) {
                    handler(e);
                }
            });
        };

        if (isClient()) {

            addEventListener(document, 'capture:scroll', callback, true);

            return () => {
                cancelAnimationFrame(frame.current);
                removeEventListener(document, 'capture:scroll', callback);
            };
        }

    }, [initRef.current, enableGetter()()]);
}
