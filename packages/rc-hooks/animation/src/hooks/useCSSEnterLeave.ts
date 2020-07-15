import {Animation, IAnimationBaseOptions} from '@co-hooks/animation';
import {useRefCallback} from '@rc-hooks/use';
import {RefObject, useEffect, useRef} from 'react';
import {useCreateAnimation} from './useCreateAnimation';

interface IAnimationOptions
    extends Omit<IAnimationBaseOptions, 'validTarget'> {
    onReady?: () => void;
    onStart?: () => void;
    onEnd?: (animating: boolean) => void;
    validTarget?: RefObject<EventTarget>;
}

export interface IUseCSSEnterLeaveOptions extends IAnimationOptions {
    allowLeaveFirst?: boolean;
    disabled?: boolean;
    show?: boolean;
    enter?: Partial<IAnimationOptions>;
    leave?: Partial<IAnimationOptions>;
}

export function useCSSEnterLeave(
    element: RefObject<HTMLElement> | HTMLElement | null,
    options: IUseCSSEnterLeaveOptions
): Animation<boolean> {
    const initRef = useRef(false);
    const {
        allowLeaveFirst,
        disabled,
        enter = {},
        leave = {},
        onReady,
        onStart,
        onEnd,
        show,
        ...extra
    } = options;

    const handleReady = useRefCallback((identifier: boolean) => {
        onReady?.();
        identifier ? enter.onReady?.() : leave.onReady?.();
    });
    const handleStart = useRefCallback((identifier: boolean) => {
        onStart?.();
        identifier ? enter.onStart?.() : leave.onStart?.();
    });
    const handleEnd = useRefCallback((identifier: boolean, animating: boolean) => {
        onEnd?.(animating);
        identifier ? enter.onEnd?.(animating) : leave.onEnd?.(animating);
    });

    const animation = useCreateAnimation<boolean>(element, {
        ...extra,
        ...(show ? enter : leave),
        onReady: handleReady,
        onStart: handleStart,
        onEnd: handleEnd
    });

    useEffect(() => {
        const init = initRef.current;
        initRef.current = true;

        if (!disabled && (init || show || allowLeaveFirst)) {
            return animation.start(show);
        }
    }, [show]);

    return animation;
}
