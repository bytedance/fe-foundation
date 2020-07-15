/**
 * @file useElementPosition 获取元素在屏幕上的位置
 */

import {useRefGetter} from '@rc-hooks/use';
import {RefObject, useCallback, useEffect, useRef} from 'react';
import {
    IElementPosition,
    IElementPositionCaptureOptions,
    addMutationHandler,
    getDefaultElementPosition,
    getElementPosition,
    isClient,
    isElementPositionEqual,
    removeMutationHandler
} from '@co-hooks/dom';
import {useContainer} from './useContainer';

export type PositionChangeHandler = (position: IElementPosition) => void;

// 注意options参数不会被刷新
export function useElementPosition(
    element: HTMLElement | null | RefObject<HTMLElement>,
    enable: () => boolean,
    onChange: PositionChangeHandler,
    options: IElementPositionCaptureOptions
): IElementPosition {

    const positionRef = useRef(getDefaultElementPosition());
    const elemGetter = useContainer(element);
    const enableGetter = useRefGetter(enable);
    const onChangeGetter = useRefGetter(onChange);

    const update = useCallback((force?: boolean) => {

        const elem = elemGetter();

        if (!force && !enableGetter()() || elem == null) {
            return;
        }

        const currentPosition = getElementPosition(elem);

        if (!isElementPositionEqual(positionRef.current, currentPosition)) {
            positionRef.current = currentPosition;
            onChangeGetter()(currentPosition);
        }
    }, []);

    // 这样可以在组件刷新的时候，更新一下位置
    useEffect(() => {

        if (!enableGetter()() || options.disabledCaptureElementUpdate) {
            return;
        }

        update();
    });

    // 组件初始化的时候报告一下位置
    useEffect(() => {

        update(true);

        if (isClient()) {

            // 任何属性的变化或者元素
            addMutationHandler(update, {
                mutation: !options.disabledCaptureElementSizeChange,
                transition: !options.disabledCaptureTransition,
                animation: !options.disabledCaptureAnimation,
                scroll: !options.disabledCaptureContainerScroll || !options.disabledCaptureStickyCheck,
                resize: !options.disabledCaptureWindowSize
            });

            return () => {
                positionRef.current = getDefaultElementPosition();
                removeMutationHandler(update);
            };
        }

    }, []);

    return positionRef.current;
}
