/**
 * @file BoardRender
 */
import {IRuntimeBoardRenderProps} from '@chief-editor/runtime';
import {FloatType, NodeType} from '@chief-editor/base';
import React, {CSSProperties, memo} from 'react';

export const BoardRender = memo((props: IRuntimeBoardRenderProps) => {

    const {className, style = {}, type, floatType, children} = props;
    const boardStyle: CSSProperties = {...style};

    if (type === NodeType.LAYER) {
        boardStyle.position = 'relative';
        boardStyle.width = '100%';
        boardStyle.height = '100%';
        boardStyle.overflow = 'hidden';
    }

    if (type === NodeType.STREAM && floatType !== FloatType.NONE) {
        Object.assign(boardStyle, {
            display: 'flex',
            flexDirection: floatType === FloatType.RIGHT ? 'column-reverse' : 'column',
            justifyItems: 'start'
        });
    }

    return (
        <div className={className} style={boardStyle}>
            {children}
        </div>
    );
});
