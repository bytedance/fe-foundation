/**
 * @file Node 节点信息
 */

import {DomNode} from '@co-hooks/dom-node';
import {MemCache} from '@co-hooks/mem-cache';

export enum FloatType {
    LEFT = 'left',
    RIGHT = 'right',
    NONE = 'none'
}

export enum NodeType {
    STREAM = 'Stream',
    ROOT = 'root',
    TEMPLATE = 'template',
    LAYER = 'layer',
    BRICK = 'brick',
    VIRTUAL = 'virtual',
    REPEAT = 'repeat'
}

export interface IDisposableNode {

    readonly id: string;

    getNode(): DomNode<INodeType>;

    dispose: () => void;
}

export type BoardType = NodeType.STREAM | NodeType.LAYER;

// Root用于模型的根节点，在编辑器里面用不到，根节点必然会缓存数据
export interface IRootNodeType {
    type: NodeType.ROOT;
    cache: MemCache<unknown>;
}

// 虚拟节点，用于形成虚拟的Scope或者形成独立的缓存
export interface IVirtualNodeType {
    type: NodeType.VIRTUAL;
    cache?: MemCache<unknown>;
    field?: string;
    repeat?: boolean;
}

// 重复节点，用于解决数组类数据结构的函数，数组中的每一个项目会形成单独的Cache
export interface IRepeatNodeType {
    type: NodeType.REPEAT;
    cache: MemCache<unknown>;
    field: string;
}

// 模板节点，是编辑器里面的根节点，由于不需要绑定，所以在编辑器里面也用不到
export interface ITemplateNodeType {
    type: NodeType.TEMPLATE;
    templateId: string;
}

// 画板类型，画板本身不提供任何信息
export interface IBoardNodeType {
    type: BoardType;
    boardId: string;
    floatType: FloatType;
}

// 组件节点类型
export interface IBrickNodeType {
    type: NodeType.BRICK;
    brickId: string;
    brickType: string;
    field?: string;
    virtual?: boolean;
}

export interface INodePath {
    type: NodeType;
    id: string;
}

export type INodeType =
    IRootNodeType
    | IVirtualNodeType
    | IRepeatNodeType
    | ITemplateNodeType
    | IBoardNodeType
    | IBrickNodeType;
