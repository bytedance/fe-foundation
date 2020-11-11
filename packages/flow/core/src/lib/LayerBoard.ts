/**
 * @file LayerBoard
 */
import {BoardType, IBrickDataGlobal, ISetBrickDataPropertyItem, NodeType} from '@chief-editor/base';
import {IElementPosition} from '@co-hooks/dom';
import {deepClone, getKeys} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';
import {IMousePos} from '@co-hooks/drag';
import {
    AlignDirection,
    BrickDragType,
    CommandType,
    IBrickDragData,
    IBrickTransformData,
    ISetBrickCommandOption,
    MoveType,
    OperationType
} from '../types';
import {EditorBoard} from './EditorBoard';
import {EditorBrickGlobal} from './EditorBrick';
import {LayerAlign} from './layer/LayerAlign';
import {LayerGroup} from './layer/LayerGroup';
import {LayerMark} from './layer/LayerMark';
import {LayerSort} from './layer/LayerSort';

export class LayerBoard extends EditorBoard {

    public readonly type: BoardType = NodeType.LAYER;

    private layerMark: LayerMark | null = null;

    private dragStatus: boolean = false;

    public isValidBoard(data: IBrickDragData): boolean {

        const editor = this.getOwnEditor();

        const activeBoard = editor.getActiveBoard();

        if (!activeBoard || activeBoard.type !== NodeType.LAYER) {
            return false;
        }

        // TODO 暂时只做在当前组内排序，不支持跨组移动
        let brickIds: string[] = [];
        // 暂时不支持新增组件添加进组
        if (data.type === BrickDragType.NEW) {
            return false;
        } else {
            brickIds = data.bricks.map(brick => brick.id);
        }

        return brickIds.every(id => {
            const brick = this.template.getBrick(id);

            if (!brick) {
                return false;
            }

            return brick.getOwnerBoard() === this;
        });
    }

    /**
     * 添加组件
     * @param brickDataList
     * @param mousePos 鼠标位置，作为元素中心点定位
     */
    public appendBricks(brickDataList: IBrickDataGlobal[], mousePos: IMousePos): void {
        const index = this.getNode().getChildNodes().length;
        const {left: templateLeft, top: templateTop} = this.template.getPosition();
        const zoom = this.getOwnEditor().getZoom() / 100;

        this.execCommandAddBrick(
            brickDataList.map(brickData => {
                const {width = 0, height = 0} = brickData.layout || {};

                // 实现以鼠标位置为中心点的定位
                return {
                    ...deepClone(brickData),
                    layout: {
                        ...brickData.layout,
                        left: Math.floor((mousePos.clientX - templateLeft) / zoom - width / 2),
                        top: Math.floor((mousePos.clientY - templateTop) / zoom - height / 2)
                    }
                };
            }),
            index
        );
    }

    public initDrag(data: IBrickDragData): void {

        // 新增元素，忽略各种辅助计算
        if (data.type === BrickDragType.NEW) {
            return;
        }

        this.layerMark = new LayerMark(this);
        this.layerMark.dragStart();
    }

    public updateDrag(data: IBrickDragData, offset: Vector): void {

        this.dragStatus = true;

        // 新增元素，不需要忽略各种辅助计算
        if (data.type === BrickDragType.NEW) {
            return;
        }

        if (!this.layerMark) {
            return;
        }

        const propsList = this.layerMark.dragging({offset, rotate: 0});

        getKeys(propsList).forEach(id => {


            const brick = this.getOwnerTemplate().getBrick(String(id));
            const {props} = propsList[id];

            // 更新组件位置，不计入历史
            brick.setBrickLayout(props);
        });
    }

    public finishDrag(dragType: OperationType, data: IBrickDragData, offset: Vector, mousePos: IMousePos): void {

        this.dragStatus = false;

        if (dragType === OperationType.CREATE) {
            let brickDataList: IBrickDataGlobal[] = [];

            if (data.type === BrickDragType.NEW) {
                brickDataList = data.brickDataList;
            } else if (data.type === BrickDragType.EXIST) {
                brickDataList = data.bricks.map(brick => brick.getBrickData(true));
            }

            if (!brickDataList.length) {
                return;
            }

            this.appendBricks(brickDataList, mousePos);
        } else if (dragType === OperationType.MOVE) {
            if (data.type === BrickDragType.NEW) {
                throw new Error('异常错误');
            }

            if (!this.layerMark) {
                return;
            }

            // 添加历史记录即可
            const options: ISetBrickCommandOption[] = [];
            const propsList = this.layerMark.dragEnd({offset, rotate: 0});

            getKeys(propsList).forEach(id => {
                const {commandOption} = propsList[id];

                if (commandOption) {
                    options.push(commandOption);
                }
            });

            this.getHistory().execCommand({
                name: CommandType.SET_BRICK,
                templateId: this.template.id,
                options
            });
        }

        this.layerMark = null;
    }

    public cancelDrag(): void {

        this.dragStatus = false;

        // 回滚位置
        if (!this.layerMark) {
            return;
        }

        const propsList = this.layerMark.cancelDrag();

        getKeys(propsList).forEach(id => {
            const brick = this.getOwnerTemplate().getBrick(String(id));
            const {oldProps} = propsList[id];

            // 更新组件位置，不计入历史
            brick.setBrickLayout(oldProps);
        });

        this.layerMark = null;
    }

    public directDragStart(brickId: string): void {
        this.layerMark = new LayerMark(this);
        this.layerMark.dragStart([brickId]);
    }

    public directDragging(brickId: string, transformData: IBrickTransformData): void {

        if (!this.layerMark) {
            return;
        }

        const propsList = this.layerMark.dragging(transformData);

        getKeys(propsList).forEach(id => {
            const props = propsList[id].props;
            const brick = this.getOwnerTemplate().getBrick(String(id));

            brick.setBrickLayout(props);
        });
    }

    public directDragEnd(brickId: string, transformData: IBrickTransformData): void {

        if (!this.layerMark) {
            return;
        }

        const propsList = this.layerMark.dragEnd(transformData);
        const options: ISetBrickCommandOption[] = [];

        getKeys(propsList).forEach(id => {
            const {commandOption} = propsList[id];

            if (commandOption) {
                options.push(commandOption);
            }
        });

        this.getHistory().execCommand({
            name: CommandType.SET_BRICK,
            templateId: this.template.id,
            options
        });

        this.layerMark = null;
    }

    public isDragging(): boolean {
        return this.dragStatus;
    }

    /**
     * 成组
     */
    public group(): void {

        const brickIds = this.getOwnerTemplate().getActiveBrickIds();

        if (brickIds.length <= 1) {
            return;
        }

        const group = new LayerGroup(this);
        const groupCommand = group.group();

        if (!groupCommand) {
            return;
        }

        this.getHistory().execCommand(groupCommand);
    }

    /**
     * 取消成组
     * @param groupId 组id
     */
    public ungroup(groupId: string): void {
        const brickIds = this.getOwnerTemplate().getActiveBrickIds();

        if (!brickIds.length) {
            return;
        }

        const group = new LayerGroup(this);
        const ungroupCommand = group.ungroup(groupId);

        if (!ungroupCommand) {
            return;
        }

        this.getHistory().execCommand(ungroupCommand);
    }

    /**
     * 移动排序
     * @param moveType
     */
    public sort(moveType: MoveType): void {
        const layerSort = new LayerSort(this);

        const sortCommand = layerSort.sort(moveType);

        if (!sortCommand) {
            return;
        }

        this.getHistory().execCommand(sortCommand);
    }

    public align(direction: AlignDirection): void {

        const layerAlign = new LayerAlign(this);
        const propsList = layerAlign.align(direction);

        if (!propsList) {
            return;
        }

        // 添加历史记录
        const options: ISetBrickCommandOption[] = [];

        getKeys(propsList).forEach(id => {

            const brick = this.getOwnerTemplate().getBrick(String(id));
            const {props, commandOption} = propsList[id];

            if (commandOption) {
                options.push(commandOption);
            }

            // 更新组件位置，不计入历史
            brick.setBrickLayout(props);
        });

        // 统一添加历史
        this.getHistory().execCommand({
            name: CommandType.SET_BRICK,
            templateId: this.getOwnerTemplate().id,
            options
        });
    }

    private convertBrickLayoutProperties(obj: Record<string, any>): ISetBrickDataPropertyItem[] {
        return getKeys(obj).map(key => ({path: `layout.${key}`, value: obj[key]}));
    }
}
