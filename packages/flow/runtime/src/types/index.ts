/**
 * @file index 类型定义
 */
import {DomNode} from '@co-hooks/dom-node';
import {FunctionAny} from '@co-hooks/util';
import {CSSProperties, FC, ReactNode, SyntheticEvent} from 'react';
import {IBoardNodeType, IBrickInstance, IBrickNodeType, INodeType} from '@chief-editor/base';
import {BrickEnv} from '@chief-editor/types';

export type IRuntimeBrickRenderProps = Omit<IBrickNodeType, 'type'> & {node: DomNode<INodeType>};

export interface IRuntimeBoardRenderProps extends IBoardNodeType {
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
    node: DomNode<INodeType>;
}

export interface IRuntimeBrickProps<V, DS, DP, CG, ST>
    extends Omit<IBrickInstance<V, DS, DP, CG, ST>, 'layout' | 'styles'> {
    styles: CSSProperties;
    layout: CSSProperties;
    setValue: (value: V) => void;
    setState: (value: Partial<ST>) => void;

    dispatchEvent(e: SyntheticEvent): void;

    dispatchEvent(name: string, param?: any): void;

    renderPart: (name: string, style?: CSSProperties, className?: string) => ReactNode;
    getDatasource: (data: unknown) => void;
    getHook: (name: string) => FunctionAny | null;

    getByExpression(...expression: Array<string | number>): any;
}

export interface IRuntimeBrickContainerRenderProps {
    brickId: string;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
    node: DomNode<INodeType>;
}

export interface IRuntimeContext {

    // 用于渲染组件
    BrickRender: FC<IRuntimeBrickRenderProps>;

    // 用于通用渲染组件
    BrickContainerRender?: FC<IRuntimeBrickContainerRenderProps>;

    // 用于特别组件渲染
    BrickContainers?: Record<string, FC<IRuntimeBrickContainerRenderProps>>;

    // 用于渲染画板，支持不同的画板类型
    BoardRender: FC<IRuntimeBoardRenderProps>;

    // 用于渲染的组件
    Bricks: Record<string, FC<IRuntimeBrickPropsGlobal>>;

    env?: BrickEnv;
}

export interface IRuntimeDispatcherProps {
    node: DomNode<INodeType>;
    style?: CSSProperties;
    className?: string;
}


export type IRuntimeBrickPropsGlobal = IRuntimeBrickProps<any, any, any, any, any>;
