/**
 * @file BaseTemplate
 */

import {DomNode} from '@co-hooks/dom-node';
import {guid} from '@co-hooks/util';
import {
    IBoardConfig,
    IBoardInstance,
    IBrickDataGlobal,
    INodeType,
    ITemplateConfig,
    NodeType
} from '@chief-editor/types';
import {BaseBrickGlobal} from './BaseBrick';

export abstract class BaseTemplate<BD extends IBoardInstance, BK extends BaseBrickGlobal> {

    public readonly id: string;

    protected readonly boardMap: Record<string, BD> = {};

    protected readonly brickMap: Record<string, BK> = {};

    protected readonly node: DomNode<INodeType>;

    protected isDisposed: boolean = false;

    protected constructor(id?: string) {
        this.id = id || guid();
        this.node = new DomNode<INodeType>({
            type: NodeType.TEMPLATE,
            templateId: this.id
        });
    }

    // 获取配置数据
    public getTemplateData(cleanId: boolean = false): ITemplateConfig {
        return {
            id: cleanId ? undefined : this.id,
            board: this.getRootBoard().getBoardData(cleanId)
        };
    }

    public getNode(): DomNode<INodeType> {

        if (this.node == null) {
            throw new Error('call `init` first');
        }

        return this.node;
    }

    public getBoard(id: string): BD {

        const board = this.boardMap[id];

        if (!board) {
            throw new Error(`board is not exist, id = ${id}`);
        }

        return board;
    }

    public getBoardByNode(node: DomNode<INodeType>): BD {

        const value = node.getValue();

        if (value.type !== NodeType.STREAM && value.type !== NodeType.LAYER) {
            throw new Error(`node is not a board node, type = ${value.type}`);
        }

        return this.getBoard(value.boardId);
    }

    public getRootBoard(): BD {

        if (this.node == null) {
            throw new Error('call `init` first');
        }

        return this.getBoard('root');
    }

    public getBrickByNode(node: DomNode<INodeType>): BK {

        const value = node.getValue();

        if (value.type !== NodeType.BRICK) {
            throw new Error('node is not a brick node, type = ' + value.type);
        }

        return this.getBrick(value.brickId);
    }

    public getBrick(brickId: string): BK {

        const brick = this.brickMap[brickId];

        if (!brick) {
            throw new Error(`Brick: ${brickId} is not under current template`);
        }

        return brick;
    }

    public getBrickMap(): Record<string, BK> {
        return this.brickMap;
    }

    public dispose(): void {

        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;

        Object.values(this.boardMap).forEach(board => board.dispose());

        Object.values(this.brickMap).forEach(brick => brick.dispose());
    }

    public createBoard(config: IBoardConfig, onCreated?: (node: DomNode<INodeType>) => void): DomNode<INodeType> {
        const board = this.innerCreateBoard(config);

        this.boardMap[board.id] = board;

        onCreated && onCreated(board.getNode());

        board.init();

        return board.getNode();
    }

    public createBrick(
        config: IBrickDataGlobal,
        board: BD,
        onCreated?: (node: DomNode<INodeType>) => void
    ): DomNode<INodeType> {

        const brick = this.innerCreateBrick(config, board);

        this.brickMap[brick.id] = brick;

        // 对于虚拟节点来说，给增加一个虚拟子节点，以方便进行数据挂载
        if (brick.virtual) {

            const vnode = new DomNode<INodeType>({
                type: NodeType.VIRTUAL
            });

            vnode.appendChild(brick.getNode());

            return vnode;
        }

        onCreated && onCreated(brick.getNode());

        brick.init();

        return brick.getNode();
    }

    public disposeNode(node: DomNode<INodeType>): void {

        if (this.node === node) {
            throw new Error('rootBoard can not be removed.');
        }

        const info = node.getValue();

        if (info.type === NodeType.BRICK) {

            const brick = this.brickMap[info.brickId];

            if (brick == null) {
                return;
            }

            brick.dispose();
            delete this.brickMap[info.brickId];

            if (brick.virtual && node.parentNode) {
                node.parentNode.remove();
            }
        } else if (info.type === NodeType.LAYER || info.type === NodeType.STREAM) {

            const board = this.boardMap[info.boardId];

            if (board == null) {
                return;
            }

            board.dispose();
            delete this.boardMap[info.boardId];
        } else if (info.type === NodeType.VIRTUAL) {
            node.getChildNodes().forEach(item => this.disposeNode(item));
        }

        node.remove();
    }

    protected init(board: IBoardConfig): void {

        this.createBoard({
            ...board,
            id: 'root'
        }, node => {
            if (!node) {
                throw new Error('create root board fail.');
            }

            Object.assign(this, {node});
        });
    }

    protected abstract innerCreateBoard(config: IBoardConfig): BD;

    protected abstract innerCreateBrick(config: IBrickDataGlobal, board: BD): BK;
}
