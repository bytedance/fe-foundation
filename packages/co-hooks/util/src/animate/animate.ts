/**
 * @file animate
 */

import {cubicBezier, presets} from './cubicBezier';

export type AnimateType = keyof typeof presets | [number, number, number, number];

export type AnimateTickFunc = (percent: number) => void;

export function animate(
    animateType: AnimateType,
    duration: number,
    tick?: AnimateTickFunc,
    end?: () => void
): [() => void, () => void] {
    let frame: number | null = null;
    let startTime: number | null = null;
    const cubicBezierGetter = Array.isArray(animateType)
        ? cubicBezier(...animateType)
        : presets[animateType];

    function innerTick(now: number = performance.now()): void {
        startTime = startTime === null ? now : startTime;
        const cost = now - startTime;

        if (duration < cost) {
            // 保证最后一次一定为1
            tick && tick(1);
            stop();
            return;
        }

        tick && tick(cubicBezierGetter(cost / duration));

        frame = requestAnimationFrame(innerTick);
    }

    function start(): void {
        frame = requestAnimationFrame(innerTick);
    }

    function stop(): void {
        frame && cancelAnimationFrame(frame);
        frame = null;
        end && end();
    }

    return [start, stop];
}
