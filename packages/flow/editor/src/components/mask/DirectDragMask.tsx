/**
 * @file DirectDragMask
 */
import {Direct, IBrickTransformData} from '@chief-editor/core';
import React from 'react';
import {useEditorCls} from '../../hooks/useEditorCls';
import {useDraggerMask} from '../../hooks/useDraggerMask';
import {DirectDragger} from './DirectDragger';

export enum DirectType {
    ALL = 'all',
    SIDE = 'side',
    ANGLE = 'angle'
}

export const DirectTypeAll = [
    Direct.LEFT_TOP, Direct.TOP, Direct.RIGHT_TOP,
    Direct.LEFT, Direct.RIGHT,
    Direct.LEFT_BOTTOM, Direct.BOTTOM, Direct.RIGHT_BOTTOM
];

export const DirectTypeSide = [
    Direct.TOP,
    Direct.LEFT,
    Direct.RIGHT,
    Direct.BOTTOM
];

export const DirectTypeAngle = [
    Direct.LEFT_TOP, Direct.RIGHT_TOP,
    Direct.LEFT_BOTTOM, Direct.RIGHT_BOTTOM
];

export interface IDirectDragMask {
    rotatable?: boolean;
    ratio: boolean;
    rotate: number;
    skew: number;
    directType: DirectType | Direct[];
    onDragStart: () => void;
    onDragging: (dragInfo: IBrickTransformData) => void;
    onDragEnd: (dragInfo: IBrickTransformData) => void;
}

export type IDirectDragMaskProps = IDirectDragMask;

export function DirectDragMask(props: IDirectDragMaskProps): JSX.Element {
    const {directType, rotate, skew, onDragStart, onDragging, onDragEnd, ratio} = props;
    const cls = useEditorCls('direct-drag-mask');

    let directList;

    switch (directType) {
        case DirectType.ALL:
            directList = DirectTypeAll;
            break;
        case DirectType.SIDE:
            directList = DirectTypeSide;
            break;
        case DirectType.ANGLE:
            directList = DirectTypeAngle;
            break;
        default:
            directList = directType;
    }

    const draggerMaskResult = useDraggerMask({onDragStart, onDragging, onDragEnd, rotate, ratio});

    return (
        <div className={cls} style={{width: '100%', height: '100%'}}>
            {
                directList.map(direct => (
                    <DirectDragger
                        key={direct}
                        data={{direct}}
                        style={{transform: `skew(-${skew}deg, 0)`}}
                        {...draggerMaskResult}
                    />
                ))
            }
        </div>
    );
}
