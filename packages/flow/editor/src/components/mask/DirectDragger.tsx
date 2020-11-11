/**
 * @file DirectDragger
 */

import {Direct} from '@chief-editor/core';
import {classnames} from '@co-hooks/util';
import {IDragOptions, useDrag} from '@rc-hooks/drag';
import React, {CSSProperties, useRef} from 'react';
import {useEditorCls} from '../..';

export interface IDraggerData {
    direct?: Direct;
    rotate?: number;
}

export interface IDirectDraggerProps extends IDragOptions<IDraggerData> {
    className?: string;
    style: CSSProperties;
}

export function DirectDragger(props: IDirectDraggerProps): JSX.Element {
    const {className, data, style, ...extra} = props;
    const dragRef = useRef<HTMLDivElement>(null);
    const cls = classnames(
        useEditorCls('direct-drag-mask-dragger', {dir: data?.direct}),
        {
            [String(className)]: !!className
        }
    );

    useDrag(dragRef, {...extra, data});

    return (
        <div
            className={cls}
            ref={dragRef}
            style={style}
        />
    );
}
