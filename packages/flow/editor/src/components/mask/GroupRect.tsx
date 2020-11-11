/**
 * @file GroupRect
 */
import React from 'react';
import {IEditorBrickDragInfo} from '@chief-editor/core';
import {useEditorCls} from '../..';

export interface IGroupRect {
    info: IEditorBrickDragInfo;
}

export function GroupRect(props: IGroupRect): JSX.Element {
    const {
        info: {offset, sizeOffset}
    } = props;

    const [left, top] = offset.get();
    const [width, height] = sizeOffset.get();

    const cls = useEditorCls('template-mask-group-rect');

    return (
        <div
            className={cls}
            style={{
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`
            }}
        />
    );
}
