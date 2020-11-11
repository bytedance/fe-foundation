/**
 * @file layout
 */

import {BoardType, ILayoutConfig, NodeType} from '@chief-editor/base';
import {CSSProperties} from 'react';

export function getBrickLayout(layout: ILayoutConfig, boardType: BoardType, float: boolean): CSSProperties {

    if (!layout) {
        return {};
    }

    const {width, height} = layout;

    if (boardType === NodeType.LAYER) {
        return getLayerBrickStyle(layout);
    }

    const brickStyle: CSSProperties = {};

    if (layout.width != null) {
        brickStyle.width = `${width}px`;
    }

    if (layout.height != null) {
        brickStyle.height = `${height}px`;
    }


    if (float) {
        Object.assign(brickStyle, {
            flexGrow: 0,
            flexShrink: 0
        });
    }

    return brickStyle;
}


export function getLayerBrickStyle(layout: ILayoutConfig): CSSProperties {

    const {
        width,
        height,
        horizontal = 'left',
        vertical = 'top',
        rotate,
        skewX = 0,
        skewY = 0,
        scaleX = 1,
        scaleY = 1
    } = layout;
    const res: CSSProperties = {
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute'
    };

    if (horizontal === 'dock') {
        Object.assign(res, {left: 0, right: 0, width: undefined});
    } else if (horizontal === 'center') {
        Object.assign(res, {
            left: '50%',
            transform: 'translateX(-50%)'
        });
    } else {
        res[horizontal] = `${layout[horizontal] || 0}px`;
    }

    if (vertical === 'dock') {
        Object.assign(res, {top: 0, bottom: 0, height: undefined});
    } else if (vertical === 'center') {
        Object.assign(res, {
            top: '50%',
            transform: 'translateY(-50%)'
        });
    } else {
        res[vertical] = `${layout[vertical] || 0}px`;
    }

    if (horizontal === 'center' && vertical === 'center') {
        res.transform = 'translate(-50%, -50%)';
    }

    if (rotate) {
        res.transform = `${res.transform || ''} rotate(${rotate}deg)`;
    }

    res.transform = `${res.transform || ''} skew(${skewX}deg, ${skewY}) scale(${scaleX}, ${scaleY})`;

    return res;
}

