/**
 * @file Board 画板基类
 */

import {BaseBoard, IBoardConfig, IBrickDataGlobal, INodeType, NodeType} from '@chief-editor/base';
import {IElementPosition, getDefaultElementPosition} from '@co-hooks/dom';
import {DomNode} from '@co-hooks/dom-node';
import {Emitter} from '@co-hooks/emitter';
import {deepClone} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';
import {
    BrickDragType,
    CommandType,
    IBrickDragData,
    IMoveBrickCommandOption,
    IRemoveBrickCommandOption,
    OperationType,
    RemoveBrickType
} from '../types';
import {Editor} from './Editor';
import {EditorBrickGlobal} from './EditorBrick';
import {EditorTemplate} from './EditorTemplate';
import {History} from './History';
import {LayerBoard} from './LayerBoard';
import {StreamBoard} from './StreamBoard';

export interface IEditorBoardEvent {
    'active-brick-change': [string[]];
    'active-change': [boolean];
}

export class EditorBoard extends BaseBoard {

    protected readonly template: EditorTemplate;

    private position: IElementPosition = getDefaultElementPosition();

    /**
     * 构造函数
     */
    constructor(template: EditorTemplate, config: IBoardConfig) {
        super(template, config);
        this.template = template;
    }

    public isLayerBoard(): this is LayerBoard {
        return this.type === NodeType.LAYER;
    }

    public isStreamBoard(): this is StreamBoard {
        return this.type === NodeType.STREAM;
    }

    public getBricks(): EditorBrickGlobal[] {

        const bricks: EditorBrickGlobal[] = [];

        this.node.getChildNodes().map(child => {
            if (child.getValue().type === NodeType.BRICK) {
                bricks.push(this.template.getBrickByNode(child));
            }
        });

        return bricks;
    }

    public getOwnerTemplate(): EditorTemplate {
        return this.template;
    }

    public getOwnEditor(): Editor {
        return this.template.getOwnEditor();
    }

    public getHistory(): History {
        return this.template.getHistory();
    }

    public getPosition(): IElementPosition {
        return this.position;
    }

    public getBoardAcceptInfo(): string[] {

        const parent = this.node.parentNode;

        if (!parent) {
            return [];
        }

        const parentValue = parent.getValue();

        if (parentValue.type === NodeType.BRICK) {
            return this.accept;
        }

        return [];
    }

    public getAbsoluteVector(): Vector {
        const node = this.node.parentNode;

        if (!node) {
            return new Vector();
        }

        const value = node.getValue();

        if (value.type === NodeType.BRICK) {
            return this.getOwnerTemplate().getBrickByNode(node).getAbsoluteVector();
        }

        return new Vector();
    }

    public setPosition(pos: IElementPosition): void {
        // TODO LayerBoard可能存在旋转的情况
        this.position = pos;
    }

    /**
     * 新增组件
     * @param data 组件数据
     * @param index 添加位置
     */
    public addBrick(data: IBrickDataGlobal, index?: number): EditorBrickGlobal | null {

        const node = this.template.createBrick(data, this);
        const brick = this.template.getBrickByNode(node);

        if (brick) {
            if (index != null) {
                this.moveBrick(this.node, brick, index);
            } else {
                this.node.appendChild(brick.getNode());
            }
        }

        return brick;
    }

    /**
     * 移动组件
     */
    public moveBrick(parent: DomNode<INodeType>, brick: EditorBrickGlobal, index?: number): number {
        brick.getNode().remove();
        return parent.insert(brick.getNode(), index);
    }

    /**
     * 更新画板变化
     *
     * @param type 拖拽类型，新建'create' | 移动'move'
     * @param data 组件数据
     * @param index 插入位置
     */
    public applyBoardChange(type: OperationType, data: IBrickDragData, index: number): void {

        if (type === OperationType.CREATE) {
            if (data.type === BrickDragType.NEW) {
                // 新增添加
                this.execCommandAddBrick(deepClone(data.brickDataList), index);
            } else if (data.type === BrickDragType.EXIST) {
                // 复制添加
                this.execCommandAddBrick(
                    data.bricks.map(brick => brick.getBrickData(true)),
                    index
                );
            }
        } else if (type === OperationType.MOVE) {
            if (data.type === BrickDragType.NEW) {
                throw new Error('异常错误');
            }

            const {templateId, bricks} = data;

            // 当前画板移动组件
            if (templateId === this.getOwnEditor().getActiveTemplateId()) {
                this.execCommandMoveBrick(bricks, index);
            } else {
                // 从功能模板拖拽过来的组件
                this.execCommandAddBrick(
                    data.bricks.map(brick => brick.getBrickData()),
                    index
                );

                bricks.forEach(brick => brick.remove());
            }
        } else if (type === OperationType.REMOVE) {
            if (data.type === BrickDragType.NEW) {
                throw new Error('异常错误');
            }

            const {templateId, bricks} = data;

            // 当前画板移动组件
            if (templateId === this.getOwnEditor().getActiveTemplateId()) {
                this.execCommandRemoveBrick(bricks);
            } else {
                bricks.forEach(brick => {
                    brick.remove();
                });
            }
        }
    }

    /**
     * 是否激活态
     */
    public isActiveBoard(): boolean {
        return this.template.getActiveBoardId() === this.id;
    }

    public emitActiveChange(): void {
        this.emit('active-change', this.isActiveBoard());
    }

    /**
     * 执行添加组件操作
     *
     * @param bricks 添加组件的数据
     * @param index 添加位置
     */
    protected execCommandAddBrick(bricks: IBrickDataGlobal[], index: number): void {
        this.getHistory().execCommand({
            name: CommandType.CREATE_BRICK,
            templateId: this.template.id,
            options: {
                boardId: this.id,
                bricks,
                index
            }
        });
    }

    /**
     * 执行移动组件
     *
     * @param bricks 移动组件的实例列表
     * @param index 移动的位置
     */
    protected execCommandMoveBrick(bricks: EditorBrickGlobal[], index: number): void {
        const commandOptions = bricks.map((brick, i) => {

            const boardNode = brick.getNode().parentNode;

            if (boardNode == null) {
                return;
            }

            return {
                boardId: this.id,
                brickId: brick.id,
                index: index + i,
                fromIndex: boardNode.getIndex(brick.getNode()),
                fromBoardId: this.template.getBoardByNode(boardNode).id
            };
        });

        this.getHistory().execCommand({
            name: CommandType.MOVE_BRICK,
            templateId: this.template.id,
            options: commandOptions as IMoveBrickCommandOption[]
        });
    }

    /**
     * 执行删除组件
     * @param bricks EditorBrick[]
     */
    protected execCommandRemoveBrick(bricks: EditorBrickGlobal[]): void {
        const commandOptions = bricks.map(brick => {

            const boardNode = brick.getNode().parentNode;

            if (boardNode == null) {
                return;
            }

            return {
                boardId: this.id,
                brickId: brick.id,
                fromIndex: boardNode.getIndex(brick.getNode()),
                toBoardId: RemoveBrickType.STASH
            };
        });

        this.getHistory().execCommand({
            name: CommandType.REMOVE_BRICK,
            templateId: this.template.id,
            options: commandOptions as IRemoveBrickCommandOption[]
        });
    }
}

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface EditorBoard extends Emitter<IEditorBoardEvent> {
}

Emitter.mixin(EditorBoard);
