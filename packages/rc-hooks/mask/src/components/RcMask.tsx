/**
 * @file RcMask 遮罩层
 */

import {getZIndex} from '@co-hooks/dom';
import {UnionOmit} from '@co-hooks/util';
import React, {CSSProperties, HTMLAttributes} from 'react';

const DEFAULT_STYLE: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'auto'
};

export interface IRcMask {
    show?: boolean;
}

export type IRcMaskProps = UnionOmit<IRcMask, HTMLAttributes<HTMLDivElement>>;

export function RcMask(props: IRcMaskProps) {

    const {show = false, style = {}, ...extra} = props;
    let zIndex = style.zIndex;

    if (typeof zIndex !== 'number') {
        zIndex = getZIndex();
    }

    return (
        <div
            {...extra}
            style={{...style, ...DEFAULT_STYLE, zIndex, display: !show ? 'none' : 'block'}}
        />
    );
}
