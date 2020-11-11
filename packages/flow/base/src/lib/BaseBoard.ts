/**
 * @file BaseTemplate
 */

import {DomNode} from '@co-hooks/dom-node';
import {guid} from '@co-hooks/util';
import {BoardType, FloatType, IBoardConfig, IBrickDataGlobal, INodeType, ITemplateInstance} from '@chief-editor/types';

export class BaseBoard {

    // 用于标识画板的类型，常量
    public readonly type: BoardType;

    public readonly id: string;

    public readonly floatType: FloatType = FloatType.NONE;

    public readonly repeat: boolean;

    protected readonly owner: ITemplateInstance;

    protected isDisposed: boolean = false;

    protected readonly node: DomNode<INodeType>;

    protected readonly accept: string[];

    private readonly bricks: IBrickDataGlobal[];

    /**
     * 构造函数
     */
    constructor(owner: ITemplateInstance, config: IBoardConfig) {

        const {type, id, floatType, bricks, accept = []} = config;

        this.owner = owner;
        this.type = type;
        this.id = id || guid();
        this.floatType = floatType || FloatType.NONE;
        this.repeat = false;
        this.accept = accept;
        this.bricks = bricks;

        this.node = new DomNode<INodeType>({
            type,
            floatType: this.floatType,
            boardId: this.id
        });
    }

    public init(): void {
        this.bricks.forEach(brick => this.owner.createBrick(brick, this, node => this.node.appendChild(node)));
    }

    /**
     * 获取画板输出数据
     */
    public getBoardData(cleanId: boolean = false): IBoardConfig {

        let {id, type, floatType} = this;

        return {
            id: cleanId ? '' : id,
            type,
            floatType,
            bricks: this.node.getChildNodes().map(node => this.owner.getBrickByNode(node).getBrickData(cleanId))
        };
    }

    public getNode(): DomNode<INodeType> {
        return this.node;
    }

    public dispose(): void {

        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;
        this.node.getChildNodes().forEach(node => this.owner.disposeNode(node));
    }
}
