/**
 * @file useDuration 一定时间间隔后执行函数
 */

import {useCallback, useEffect, useRef} from 'react';
import {useRefCallback} from './useRefCallback';

export function useTimeout(duration: number, handler?: VoidFunction): VoidFunction {

    const handlerCallback = useRefCallback(handler);
    const timerRef = useRef<number | null>(null);

    const setup = useCallback((timeout: number) => {
        const timerHandler: Function = () => {
            timerRef.current = null;
            handlerCallback();
        };

        timerRef.current = setTimeout(timerHandler, timeout);
    }, []);

    const teardown = useCallback(() => {

        if (timerRef.current == null) {
            return;
        }

        clearTimeout(timerRef.current);
        timerRef.current = null;
    }, []);

    useEffect(() => {

        if (duration === 0) {
            return;
        }

        setup(duration);

        return teardown;

    }, [duration]);

    return teardown;
}
