/**
 * @file RotateDrag
 */

import {Vector} from '@co-hooks/vector';
import {useRefCallback, useRefGetter, useToggle} from '@rc-hooks/use';
import React, {useCallback, useRef} from 'react';
import {classnames} from '@co-hooks/util';
import {IDragEvent, IDragOptions, useDrag} from '@rc-hooks/drag';
import {getRotate} from '@chief-editor/core';
import {useTemplate} from '../../hooks/useTemplate';
import {useEditorCls} from '../../hooks/useEditorCls';
import {IDraggerData} from './DirectDragger';

export interface IRotateDraggerProps extends IDragOptions<IDraggerData> {
    className?: string;
    rotate: number;
    center: Vector;
    pos: Vector;
}

export function RotateDragger(props: IRotateDraggerProps): JSX.Element {
    const {className, rotate, center, onDragStart, onDragging, onDragEnd, pos, ...extra} = props;
    const dragRef = useRef<HTMLDivElement>(null);
    const [dragStatus, setDrag, cancelDrag] = useToggle(false);

    const template = useTemplate();
    const centerGetter = useRefGetter(center);
    const onDragStartCallback = useRefCallback(onDragStart);
    const onDraggingCallback = useRefCallback(onDragging);
    const onDragEndCallback = useRefCallback(onDragEnd);

    const handleDragStart = useCallback((e: IDragEvent<IDraggerData>): void => {
        setDrag();
        onDragStartCallback(e);
    }, []);

    const handleDragging = useCallback((e: IDragEvent<IDraggerData>): void => {
        const {left, top} = template.getPosition();

        (e.data as IDraggerData).rotate = getDaltRotate(
            centerGetter(),
            new Vector([left, top]),
            e
        );

        onDraggingCallback(e);
    }, []);

    const handleDragEnd = useCallback((e: IDragEvent<IDraggerData>): void => {
        const {left, top} = template.getPosition();

        (e.data as IDraggerData).rotate = getDaltRotate(
            centerGetter(),
            new Vector([left, top]),
            e
        );

        cancelDrag();
        onDragEndCallback(e);
    }, []);

    const cls = classnames(
        useEditorCls('direct-drag-mask-rotate-dragger'),
        {
            [String(className)]: !!className
        }
    );

    const markCls = useEditorCls('direct-drag-mask-rotate-dragger-mark');

    useDrag(dragRef, {
        ...extra,
        onDragStart: handleDragStart,
        onDragging: handleDragging,
        onDragEnd: handleDragEnd
    });

    const [left, top] = pos.get();

    return (
        <div
            className={cls}
            ref={dragRef}
            style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`
            }}
        >
            旋转
            {dragStatus && <div className={markCls}>{rotate}°</div>}
        </div>
    );
}

function getDaltRotate(center: Vector, templateOffset: Vector, e: IDragEvent<IDraggerData>): number {
    const {startMousePos, currentMousePos} = e;
    const [left, top] = templateOffset.get();
    const start = new Vector([startMousePos.clientX - left, startMousePos.clientY - top]);
    const end = new Vector([currentMousePos.clientX - left, currentMousePos.clientY - top]);

    return Math.floor(getRotate(center, start, end));
}
