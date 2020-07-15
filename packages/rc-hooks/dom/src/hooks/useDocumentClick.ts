/**
 * @file useDocumentClick 文档点击
 */

import {useRefGetter} from '@rc-hooks/use';
import {useEffect, useRef} from 'react';
import {addEventListener, isClient, removeEventListener} from '@co-hooks/dom';

export type DocClickHandler = (e: MouseEvent) => void;

export function useDocumentClick(
    enable: () => boolean,
    onClick: DocClickHandler
): void {

    const onDocClickGetter = useRefGetter<DocClickHandler>(onClick);
    const initRef = useRef(false);
    const enableGetter = useRefGetter(enable);

    useEffect(() => {

        // 第一次enable之后绑定事件，组件不销毁不解绑
        if (!enableGetter()()) {
            return;
        }

        initRef.current = true;

        const callback = (e: Event): void => {

            if (!enableGetter()()) {
                return;
            }

            onDocClickGetter()(e as MouseEvent);
        };

        if (isClient()) {
            addEventListener(document, 'click', callback, false);

            return () => removeEventListener(document, 'click', callback);
        }

    }, [initRef.current, enableGetter()()]);
}
