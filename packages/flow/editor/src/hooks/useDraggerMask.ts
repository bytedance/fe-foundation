/**
 * @file useDraggerMask
 */
import {useCallback} from 'react';
import {IDragEvent} from '@rc-hooks/drag';
import {Vector} from '@co-hooks/vector';
import {IBrickTransformData} from '@chief-editor/core';
import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {IDraggerData} from '../components/mask/DirectDragger';
import {useEditor} from './useEditor';

export interface IUseDraggerMaskResult {
    onDragStart: () => void;
    onDragEnd: (e: IDragEvent<IDraggerData>) => void;
    onDragging: (e: IDragEvent<IDraggerData>) => void;
}

export interface IUseDraggerMaskOptions {
    onDragStart: () => void;
    onDragging: (dragInfo: IBrickTransformData) => void;
    onDragEnd: (dragInfo: IBrickTransformData) => void;
    rotate: number;
    ratio: boolean;
}

export function useDraggerMask(options: IUseDraggerMaskOptions): IUseDraggerMaskResult {
    const {onDragStart, onDragging, onDragEnd, ratio} = options;

    const onDragStartCallback = useRefCallback(onDragStart);
    const onDraggingCallback = useRefCallback(onDragging);
    const onDragEndCallback = useRefCallback(onDragEnd);

    const editor = useEditor();
    const ratioGetter = useRefGetter(ratio);

    const handleDragging = useCallback((e: IDragEvent<IDraggerData>) => {
        onDraggingCallback(calcDragTransformData(e, editor.getZoom(), ratioGetter()));
    }, []);

    const handleDragEnd = useCallback((e: IDragEvent<IDraggerData>) => {
        onDragEndCallback(calcDragTransformData(e, editor.getZoom(), ratioGetter()));
    }, []);

    return {
        onDragStart: onDragStartCallback,
        onDragging: handleDragging,
        onDragEnd: handleDragEnd
    };
}

function calcDragTransformData(e: IDragEvent<IDraggerData>, zoom: number, ratio: boolean): IBrickTransformData {
    const {data, startMousePos, currentMousePos} = e;
    zoom = zoom / 100;

    return {
        offset: new Vector([
            (currentMousePos.clientX - startMousePos.clientX) / zoom,
            (currentMousePos.clientY - startMousePos.clientY) / zoom
        ]),
        rotate: data?.rotate || 0,
        direct: data?.direct,
        isRotate: data?.rotate != null,
        ratio: !!e.shiftKey || ratio
    };
}
