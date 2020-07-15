/**
 * @file useScheduleMask 获取mask信息及内容
 */
import {IDragEvent} from '@co-hooks/drag';
import {IElementPosition} from '@co-hooks/dom';
import {useDrag} from '@rc-hooks/drag';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {RefObject, useCallback, useEffect} from 'react';
import {DragMask, IDragMaskEvent, IDragMaskOptions} from '@co-hooks/drag-mask';
import {useContainer, useElementPosition} from '@rc-hooks/dom';

export interface IUseDragMaskOptions<T> extends IDragMaskOptions {
    data?: T;
    draggable: boolean;
    onStart?: (e: IDragMaskEvent<T>) => void;
    onChange?: (e: IDragMaskEvent<T>) => void;
    onEnd?: (e: IDragMaskEvent<T>) => void;
}

export function useDragMask<T>(
    elem: HTMLElement | RefObject<HTMLElement> | null,
    options: IUseDragMaskOptions<T>
): DragMask<T> {

    const {draggable, data, onChange, onEnd, onStart, ...extra} = options;

    const mask = useSingleton(() => new DragMask<T>());
    const getContainer = useContainer(elem);

    const onChangeCallback = useRefCallback(onChange);
    const onEndCallback = useRefCallback(onEnd);
    const onStartCallback = useRefCallback(onStart);

    const onDragStart = useCallback((e: IDragEvent<T>) => {
        mask.updateStartPos(e);
    }, []);

    const onDragging = useCallback((e: IDragEvent<T>) => {
        mask.updateEndPos(e);
    }, []);

    const onDragEnd = useCallback((e: IDragEvent<T>) => {
        mask.stopDrag(e);
    }, []);

    mask.updateOptions(extra);

    useDrag(elem, {
        draggable,
        data,
        onDragEnd,
        onDragging,
        onDragStart
    });

    useElementPosition(
        elem,
        () => true,
        (rect: IElementPosition) => {
            mask.updateBoxRect(rect);
        },
        {}
    );

    useEffect(() => {
        mask.updateContainer(getContainer());
    });

    useEffect(() => {

        mask.addListener('change', onChangeCallback);
        mask.addListener('start', onStartCallback);
        mask.addListener('end', onEndCallback);

        return () => {
            mask.removeListener('change', onChangeCallback);
            mask.removeListener('start', onStartCallback);
            mask.removeListener('end', onEndCallback);
        };
    }, []);


    return mask;
}
