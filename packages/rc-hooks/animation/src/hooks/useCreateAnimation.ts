/**
 * @file useCreateAnimation
 */
import {RefObject, useEffect} from 'react';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {useContainer} from '@rc-hooks/dom';
import {Animation, IAnimationBaseOptions} from '@co-hooks/animation';

export interface IAnimationOptions<T>
    extends Omit<IAnimationBaseOptions, 'validTarget'> {
    onReady?: (identifier: T) => void;
    onStart?: (identifier: T) => void;
    onEnd?: (identifier: T, animating: boolean) => void;
    validTarget?: RefObject<EventTarget>;
}

export function useCreateAnimation<T>(
    elem: RefObject<HTMLElement> | HTMLElement | null,
    options: IAnimationOptions<T>
): Animation<T> {
    const animation = useSingleton(() => new Animation<T>());
    const {onReady, onStart, onEnd, validTarget, ...extra} = options;

    const elemGetter = useContainer(elem);

    const onReadyCallback = useRefCallback(onReady);
    const onStartCallback = useRefCallback(onStart);
    const onEndCallback = useRefCallback(onEnd);

    useEffect(() => {
        animation.setEle(elemGetter());
        animation.updateOptions({...extra, validTarget: validTarget?.current});
    });

    useEffect(() => {
        animation.addListener('animate-ready', onReadyCallback);
        animation.addListener('animate-start', onStartCallback);
        animation.addListener('animate-end', onEndCallback);

        return () => {
            animation.removeListener('animate-ready', onReadyCallback);
            animation.removeListener('animate-start', onStartCallback);
            animation.removeListener('animate-end', onEndCallback);
        };
    }, []);

    return animation;
}
