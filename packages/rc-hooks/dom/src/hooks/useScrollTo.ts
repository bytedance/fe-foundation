/**
 * @file useScrollTo
 */
import {RefObject, useCallback, useRef} from 'react';
import {AnimateType, animate} from '@co-hooks/util';
import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {getElementScroll} from '@co-hooks/dom';
import {useContainer} from './useContainer';

export type ScrollDirection = 'left' | 'top';

export interface IUseScrollToResult {
    startScroll: () => void;
    stopScroll: () => void;
}

export interface IUseScrollToOptions {
    start?: () => void;
    end?: () => void;
    animateType?: AnimateType;
}

export function useScrollTo(
    container: RefObject<HTMLElement> | HTMLElement | null,
    direction: ScrollDirection,
    targetPosition: number | (() => number),
    duration: number | (() => number),
    enable: () => boolean,
    options: IUseScrollToOptions = {}
): IUseScrollToResult {
    const getContainer = useContainer(container);
    const stopRef = useRef<(() => void) | null>(null);
    const {start, end, animateType} = options;

    const startCallback = useRefCallback(start);
    const endCallback = useRefCallback(end);
    const directionGetter = useRefGetter(direction);
    const targetPositionGetter = useRefGetter(targetPosition);
    const enableGetter = useRefGetter(enable);
    const durationGetter = useRefGetter(duration);
    const animateTypeGetter = useRefGetter(animateType);

    const handleStartAnimate = useCallback(() => {

        const targetElem = getContainer();

        if (!enableGetter()() || targetElem == null) {
            return;
        }

        let tPosition = targetPositionGetter();
        tPosition = typeof tPosition === 'number' ? tPosition : tPosition();

        const scrollObj = getElementScroll(targetElem);
        const scrollMethod = directionGetter() === 'left' ? 'scrollLeft' : 'scrollTop';
        const startPos = scrollObj[scrollMethod];
        const distance = tPosition - startPos;

        startCallback();
        let durationTime = durationGetter();
        durationTime = typeof durationTime === 'number' ? durationTime : durationTime();

        const tick = (percent: number): void => {
            targetElem.scrollTo({[directionGetter()]: startPos + percent * distance});
        };

        const [start, stop] = animate(
            animateTypeGetter() || 'easeInOut',
            durationTime,
            tick,
            endCallback
        );

        start();
        stopRef.current = stop;
    }, []);

    const handleStopAnimate = useCallback(() => {
        stopRef.current && stopRef.current();
    }, []);

    return {
        startScroll: handleStartAnimate,
        stopScroll: handleStopAnimate
    };
}

