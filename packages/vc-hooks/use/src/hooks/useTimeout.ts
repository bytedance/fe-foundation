/**
 * @file useDuration 一定时间间隔后执行函数
 */
import {onUnmounted, ref} from 'vue-hooks-env';

export interface ITimeoutResult {
    setup: (timeout: number) => void;
    teardown: VoidFunction;
}

export function useTimeout(handler: VoidFunction): ITimeoutResult {

    let timer: number | null = null;
    const duration = ref(0);

    const teardown = (): void => {

        if (timer == null) {
            return;
        }

        clearTimeout(timer);
        timer = null;
    };

    const setup = (timeout: number): void => {

        if (timeout !== duration.value) {
            duration.value = timeout;
        }

        teardown();

        if (duration.value === 0) {
            return;
        }

        const timerHandler: Function = () => {
            timer = null;
            handler();
        };

        timer = setTimeout(timerHandler, timeout);
    };

    onUnmounted(teardown);

    return {setup, teardown};
}
