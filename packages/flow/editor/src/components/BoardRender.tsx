/**
 * @file BoardRender
 */
import {getElementPosition} from '@co-hooks/dom';
import {classnames} from '@co-hooks/util';
import {IRuntimeBoardRenderProps} from '@chief-editor/runtime';
import {FloatType, NodeType} from '@chief-editor/base';
import React, {CSSProperties, memo, useEffect, useRef, useState} from 'react';
import {useEditorCls} from '../hooks/useEditorCls';
import {useTemplate} from '../hooks/useTemplate';

export const BoardRender = memo((props: IRuntimeBoardRenderProps) => {

    const {className, style = {}, boardId, type, floatType, children, node} = props;
    const template = useTemplate();
    const board = template.getBoardByNode(node);
    const [active, setActive] = useState(board.isActiveBoard());
    const [empty, setEmpty] = useState(board.getNode().isEmpty());
    const container = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        board.addListener('active-change', setActive);
        return () => {
            board.removeListener('active-change');
        };
    }, []);

    useEffect(() => {

        const callback = (): void => {
            setEmpty(board.getNode().isEmpty());
        };

        board.getNode().addListener('childChange', callback);

        return () => board.getNode().removeListener('childChange', callback);
    }, [board.getNode()]);

    useEffect(() => {
        const target = container.current;
        if (target) {
            board.setPosition(getElementPosition(target as HTMLElement));
        }
    });

    const boardStyle: CSSProperties = {...style};

    if (type === NodeType.LAYER) {

        boardStyle.position = 'relative';
        boardStyle.width = '100%';
        boardStyle.height = '100%';

        // if (!active) {
        //     boardStyle.overflow = 'hidden';
        // }
    }

    if (type === NodeType.STREAM && floatType !== FloatType.NONE) {
        Object.assign(boardStyle, {
            display: 'flex',
            flexDirection: floatType === FloatType.RIGHT ? 'column-reverse' : 'column',
            justifyItems: 'start'
        });
    }

    const cls = classnames(
        className,
        useEditorCls('board', {
            active,
            [floatType.toLowerCase()]: floatType !== FloatType.NONE,
            [type.toLowerCase()]: true,
            empty
        })
    );

    return (
        <div
            className={cls}
            data-board-id={board.id}
            id={active ? 'data-root-' + boardId : undefined}
            style={boardStyle}
            ref={container}
        >
            {children}
        </div>
    );
});
