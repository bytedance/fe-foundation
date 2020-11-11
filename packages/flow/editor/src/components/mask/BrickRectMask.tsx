/**
 * @file BrickRectMask
 */
import {Direct, IBrickTransformData, ITemplateMaskActiveBrickRectInfo} from '@chief-editor/core';
import {Vector} from '@co-hooks/vector';
import {useRefGetter, useUpdate} from '@rc-hooks/use';
import React, {Fragment, useCallback, useEffect} from 'react';
import {useDraggerMask} from '../../hooks/useDraggerMask';
import {useEditorCls} from '../../hooks/useEditorCls';
import {useTemplate} from '../../hooks/useTemplate';
import {DirectDragMask, DirectType} from './DirectDragMask';
import {RotateDragger} from './RotateDragger';

export interface IBrickRectMask {
    boardId: string;
    data: ITemplateMaskActiveBrickRectInfo;
}

export type IBrickRectMaskProps = IBrickRectMask;

export function BrickRectMask(props: IBrickRectMaskProps): JSX.Element {
    const {boardId, data: {id, rect: {left, top, width, height}, transform, rotatePoint}} = props;

    const update = useUpdate();
    const cls = useEditorCls('template-brick-mask-item');
    const template = useTemplate();
    const boardGetter = useRefGetter(template.getBoard(boardId));
    const brick = template.getBrick(id);
    const {vertical, horizontal, ratio = false} = brick.layout;

    let directType: DirectType | Direct[] = DirectType.ALL;

    if (vertical === 'dock' && horizontal === 'dock') {
        directType = [];
    } else if (vertical === 'dock') {
        directType = [Direct.LEFT, Direct.RIGHT];
    } else if (horizontal === 'dock') {
        directType = [Direct.TOP, Direct.BOTTOM];
    } else if (ratio) {
        directType = DirectType.ANGLE;
    }

    const handleDragStart = useCallback(() => {
        const board = boardGetter();

        if (board.isLayerBoard()) {
            // 更新组件
            board.directDragStart(id);
        }
    }, []);

    const handleDragging = useCallback((info: IBrickTransformData) => {
        const board = boardGetter();

        if (board.isLayerBoard()) {
            // 更新组件
            board.directDragging(id, info);
        }
    }, []);

    const handleDragEnd = useCallback((info: IBrickTransformData) => {
        const board = boardGetter();

        if (board.isLayerBoard()) {
            // 记录历史
            board.directDragEnd(id, info);
        }
    }, []);

    const {scaleX, scaleY, skewX, skewY, rotate} = transform;

    const rotateDraggerMaskResult = useDraggerMask({
        onDragStart: handleDragStart,
        onDragging: handleDragging,
        onDragEnd: handleDragEnd,
        rotate,
        ratio
    });

    useEffect(() => {
        brick.addListener('lock-change', update);

        return () => {
            brick.removeListener('lock-change', update);
        };
    }, [brick]);

    if (brick.getLock()) {
        return (
            <div
                className={cls}
                style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `rotate(${rotate}deg) skew(${skewX}deg, ${skewY}deg) scale(${scaleX}, ${scaleY})`
                }}
            >
                <DirectDragMask
                    onDragStart={handleDragStart}
                    onDragging={handleDragging}
                    onDragEnd={handleDragEnd}
                    skew={skewX}
                    rotate={rotate}
                    directType={[]}
                    ratio={ratio}
                />
            </div>
        );
    }

    return (
        <Fragment>
            <div
                className={cls}
                style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `rotate(${rotate}deg) skew(${skewX}deg, ${skewY}deg) scale(${scaleX}, ${scaleY})`
                }}
            >
                <DirectDragMask
                    onDragStart={handleDragStart}
                    onDragging={handleDragging}
                    onDragEnd={handleDragEnd}
                    skew={skewX}
                    rotate={rotate}
                    directType={directType}
                    ratio={ratio}
                />
            </div>
            {
                <RotateDragger
                    data={{}}
                    rotate={rotate}
                    center={new Vector([Math.floor(left + width / 2), Math.floor(top + height / 2)])}
                    pos={rotatePoint}
                    {...rotateDraggerMaskResult}
                />
            }
        </Fragment>
    );
}
