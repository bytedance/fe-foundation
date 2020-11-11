/**
 * @file RegionSelect
 */

import React from 'react';
import {IElementPosition} from '@co-hooks/dom';
import {useEditorCls} from '../../hooks/useEditorCls';

export interface IRegionRect {
    data: IElementPosition;
}

export function RegionRect(props: IRegionRect): JSX.Element {
    const {data: {left, top, width, height}} = props;
    const cls = useEditorCls('template-region-rect');

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
