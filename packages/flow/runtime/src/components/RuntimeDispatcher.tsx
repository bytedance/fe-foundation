/**
 * @file RuntimeDispatcher 组件列表分发
 */

import {DomNode} from '@co-hooks/dom-node';
import {INodeType, NodeType} from '@chief-editor/base';
import {useSafeInit, useShallowState} from '@rc-hooks/use';
import React, {CSSProperties, Fragment, memo} from 'react';
import {useRuntime} from '../hooks/useRuntime';
import {IRuntimeDispatcherProps} from '../types';

/**
 * 组件列表分发（通过一次获取信息增加效率）
 */
export const RuntimeDispatcher = memo((props: IRuntimeDispatcherProps) => {

    const {node, style, className} = props;
    const {BrickRender, BoardRender} = useRuntime();
    const value = node.getValue();

    if (value.type === NodeType.BRICK) {
        return (
            <BrickRender
                key={node.id}
                node={node}
                brickType={value.brickType}
                brickId={value.brickId}
            />
        );
    }

    if (value.type === NodeType.STREAM || value.type === NodeType.LAYER) {
        return (
            <BoardRender
                key={node.id}
                node={node}
                type={value.type}
                floatType={value.floatType}
                boardId={value.boardId}
                className={className}
                style={style}
            >
                <RuntimeListDispatcher key={node.id} node={node} />
            </BoardRender>
        );
    }

    // root 和template都是虚拟渲染就可以了
    return (
        <RuntimeListDispatcher key={node.id} node={node} />
    );
});

export interface IRuntimeListDispatcherProps {
    node: DomNode<INodeType>;
    style?: CSSProperties;
    className?: string;
}

const RuntimeListDispatcher = memo((props: IRuntimeListDispatcherProps) => {

    const {node, className, style} = props;
    const [list, setList] = useShallowState(() => node.getChildNodes());

    useSafeInit(() => {

        const callback = (): void => {
            setList(node.getChildNodes());
        };

        node.addListener('childChange', callback);

        return () => node.removeListener('childChange', callback);
    });

    return (
        <Fragment>
            {list.map(subMode => (
                <RuntimeDispatcher
                    style={style}
                    className={className}
                    key={subMode.id}
                    node={subMode}
                />
            ))}
        </Fragment>
    );
});
