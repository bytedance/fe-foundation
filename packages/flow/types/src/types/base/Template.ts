/**
 * @file Template
 */

import {DomNode} from '@co-hooks/dom-node';
import {IDisposableNode, INodeType} from './Node';
import {IBoardConfig, IBoardInstance} from './Board';
import {IBrickDataGlobal, IBrickGlobal} from './Brick';

export interface ITemplateConfig {
    id?: string;
    board: IBoardConfig;
}

export interface ITemplateInstance extends IDisposableNode {

    createBoard(config: IBoardConfig, onCreated?: (node: DomNode<INodeType>) => void): DomNode<INodeType>;

    createBrick(
        config: IBrickDataGlobal, parent: IBoardInstance, onCreated?: (node: DomNode<INodeType>) => void
    ): DomNode<INodeType>;

    disposeNode(node: DomNode<INodeType>): void;

    getTemplateData(cleanId?: boolean): ITemplateConfig;

    getBrick(id: string): IBrickGlobal;

    getBoard(id: string): IBoardInstance;

    getBoardByNode(node: DomNode<INodeType>): IBoardInstance;

    getBrickByNode(node: DomNode<INodeType>): IBrickGlobal;
}
