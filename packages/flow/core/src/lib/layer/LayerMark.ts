/**
 * @file LayerMark
 */
import {ITransform} from '@chief-editor/base';
import {IElementPosition} from '@co-hooks/dom';
import {getKeys} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';
import {
    IAuxiliaryLine,
    IBrickTransformData,
    IEditorBrickDragInfo,
    IEquidistanceLine,
    IGroupDragTransform,
    ILayerMarkDragResult,
    IRect
} from '../../types';
import {getDefaultEditorBrickDragInfo, getDefaultTransform} from '../../util/brick';
import {BrickTransform} from '../BrickTransform';
import {EditorBrickGlobal} from '../EditorBrick';
import {EditorTemplate} from '../EditorTemplate';
import {LayerBoard} from '../LayerBoard';
import {getPolygonsRectByRectList} from '../../util/math';
import {LayerEquidistance} from './LayerEquidistance';
import {LayerAdsorption, getDefaultAuxiliaryLine} from './LayerAdsorption';

export interface IGroupRectPos extends IEditorBrickDragInfo {
    start: Vector;
    startSize: Vector;
    startTransform: ITransform;
}

export class LayerMark {

    /**
     * 根据BrickList 获取外接矩形
     *
     * @param brickIds
     * @param board
     * @param transformMap
     */
    public static getBrickGroupRect(
        brickIds: string[],
        board: LayerBoard,
        transformMap: Record<string, BrickTransform> = {}
    ): IEditorBrickDragInfo {
        const rectList: IRect[] = [];

        brickIds.forEach(id => {
            const transform = transformMap[id] || (new BrickTransform(board, id));
            const rect = transform.getTransformRect({
                ...getDefaultEditorBrickDragInfo(),
                transform: transform.getStartDragInfo().transform
            });
            const {offset, sizeOffset} = rect;
            rectList.push({offset, sizeOffset});
        });

        const groupRect = getPolygonsRectByRectList(rectList);

        return {
            ...groupRect,
            transform: getDefaultTransform()
        };
    }

    private readonly board: LayerBoard;

    private refBrickTransform: Record<string, BrickTransform> = {};

    private activeBrickTransform: Record<string, BrickTransform> = {};

    private groupBrickTransform: Record<string, BrickTransform> = {};

    private refBrickWrapPosition: Record<string, IElementPosition> = {};

    private groupRectPos: IGroupRectPos | null = null;

    // 辅助线
    private auxiliaryLine: IAuxiliaryLine = getDefaultAuxiliaryLine();

    constructor(board: LayerBoard) {
        this.board = board;
    }

    public dragStart(brickIds: string[] = []): void {
        this.splitBrick(brickIds);
        this.calBricksGroupRect();
        this.calAuxiliaryLine();
        this.getOwnerTemplate().getMask().setGroupRectPos(this.groupRectPos);
    }

    public dragging(transformData: IBrickTransformData, isEnd: boolean = false): ILayerMarkDragResult {
        const res: ILayerMarkDragResult = {};

        // 外接矩形不存在，证明没有active组件
        if (!this.groupRectPos) {
            return res;
        }

        const {direct, isRotate = false, offset} = transformData;

        // 旋转
        if (isRotate) {
            getKeys(this.activeBrickTransform).forEach(id => {
                const transform = this.activeBrickTransform[id];
                const info = transform.calcRotateDragInfo(transformData);

                const [props, oldProps] = transform.getApplyBrickProps(info);
                const option = transform.getSetBrickProp(info);

                res[id] = {props, oldProps, commandOption: option};
            });

            return res;
        }

        // 平移操作，先比对外接矩形的吸附功能，调整偏移量
        if (!direct) {
            const {start: groupOffset, startSize: groupSizeOffset} = this.groupRectPos;
            const newGroupOffset = Vector.addVector(groupOffset, offset);

            const [vectorOffset, lines, points] = this.getAdsorption({
                offset: newGroupOffset,
                sizeOffset: groupSizeOffset
            });

            const correctVector = Vector.addVector(offset, vectorOffset);

            getKeys(this.activeBrickTransform).forEach(id => {
                const transform = this.activeBrickTransform[id];
                const info = transform.calcTranslateDragInfo({offset: correctVector, rotate: 0});

                const [props, oldProps] = transform.getApplyBrickProps(info);
                const option = transform.getSetBrickProp(info);

                res[id] = {props, oldProps, commandOption: option};
            });

            if (!isEnd) {
                this.groupRectPos.offset = Vector.addVector(this.groupRectPos.start, correctVector);
                const mask = this.getOwnerTemplate().getMask();

                mask.setGroupRectPos(this.groupRectPos, true);
                mask.setAuxiliaryLine(lines, points, true);
                mask.setEquidistance(this.getEquidistance(this.groupRectPos), true);
            }

            return res;
        }

        // 目前情况元素变换是单独元素触发，所以虽然写的循环，实际上是操作一个元素
        getKeys(this.activeBrickTransform).forEach(id => {
            const transform = this.activeBrickTransform[id];
            let scaledInfo = transform.getTransformScaledRect(transformData);

            // 不合法的变换
            if (!scaledInfo) {
                return;
            }

            const [scaledRect] = scaledInfo;
            const [vectorOffset, lines, points] = this.getAdsorption(scaledRect);

            // 偏移后的坐标重新计算外接矩形和偏移结果
            let info = transform.calcTransformDragInfo({
                ...transformData,
                offset: Vector.addVector(transformData.offset, vectorOffset)
            });

            if (!info) {
                return;
            }

            const brick = this.getOwnerTemplate().getBrick(id);

            if (brick.brickType === 'Group') {
                Object.assign(res, this.getGroupDragResult({
                    group: brick,
                    dragInfo: info
                }));

                // if (isEnd) {
                //     const startInfo = transform.getStartDragInfo();
                //     // 为了降低变换后的精度问题，重新根据内部元素计算组合容器的位置和宽高
                //     const newRect = this.getGroupBrickRect(brick);
                //     info = {
                //         ...info,
                //         offset: Vector.subVector(newRect.offset, startInfo.offset),
                //         sizeOffset: Vector.subVector(newRect.sizeOffset, startInfo.sizeOffset)
                //     };
                // }
            }

            const rectInfo = transform.getTransformRect(info);

            const [props, oldProps] = transform.getApplyBrickProps(info);
            const option = transform.getSetBrickProp(info);

            res[id] = {props, oldProps, commandOption: option};

            if (!isEnd) {
                const mask = this.getOwnerTemplate().getMask();

                if (this.groupRectPos) {
                    Object.assign(this.groupRectPos, rectInfo);

                    mask.setGroupRectPos(this.groupRectPos, true);
                }

                mask.setAuxiliaryLine(lines, points, true);
            }
        });
        return res;
    }

    public dragEnd(transformData: IBrickTransformData): ILayerMarkDragResult {
        const res = this.dragging(transformData, true);

        this.resetDrag();

        return res;
    }

    public cancelDrag(): ILayerMarkDragResult {
        const res: ILayerMarkDragResult = {};

        getKeys(this.activeBrickTransform).forEach(id => {
            const transform = this.activeBrickTransform[id];
            const info = getDefaultEditorBrickDragInfo();
            const [props, oldProps] = transform.getApplyBrickProps(info);
            const option = transform.getSetBrickProp(info);

            res[id] = {props, oldProps, commandOption: option};
        });

        this.resetDrag();

        return res;
    }

    private resetDrag(): void {
        this.refBrickTransform = {};
        this.activeBrickTransform = {};
        this.refBrickWrapPosition = {};
        this.groupRectPos = null;
        const mask = this.getOwnerTemplate().getMask();
        mask.setGroupRectPos(null);
        mask.setAuxiliaryLine(getDefaultAuxiliaryLine(), []);
        mask.setEquidistance({x: [], y: []});
    }

    private getGroupDragResult(data: IGroupDragTransform): ILayerMarkDragResult {
        const groupList: IGroupDragTransform[] = [data];

        const res: ILayerMarkDragResult = {};

        while (groupList.length) {
            const {group, dragInfo} = groupList.shift() as IGroupDragTransform;

            const groupTransform = this.activeBrickTransform[group.id] || this.groupBrickTransform[group.id];

            if (!groupTransform) {
                continue;
            }

            const groupStart = groupTransform.getStartDragInfo();
            const boardNode = group.getPart('content');

            if (!boardNode) {
                continue;
            }

            const board = this.getOwnerTemplate().getBoardByNode(boardNode) as LayerBoard;

            const {sizeOffset: startSize} = groupStart;
            const {sizeOffset} = dragInfo;

            const [width, height] = startSize.get();
            const [wDalt, hDalt] = sizeOffset.get();

            const wDaltScale = wDalt / width;
            const hDaltScale = hDalt / height;

            board.getBricks().forEach(brick => {
                const id = brick.id;
                const transform = this.groupBrickTransform[id];
                const startInfo = transform.getStartDragInfo();

                const {transformRectInfo: {relativeOffset}} = startInfo;
                const scaleVector = new Vector([1 + wDaltScale, 1 + hDaltScale]);

                const wrapperOffset = new Vector([
                    wDaltScale * relativeOffset.getX(),
                    hDaltScale * relativeOffset.getY()
                ]);

                const info = transform.calcDragInfoByScaleTransformRect(scaleVector);

                // 外接矩形偏移offset校正
                info.offset.add(wrapperOffset);

                const [props, oldProps] = transform.getApplyBrickProps(info);
                const option = transform.getSetBrickProp(info);

                res[id] = {props, oldProps, commandOption: option};

                if (brick.brickType === 'Group') {
                    groupList.push({
                        group: brick,
                        dragInfo: info
                    });
                }
            });
        }

        return res;
    }

    private getGroupBrickRect(brick: EditorBrickGlobal): IRect {
        if (brick.brickType !== 'Group') {
            throw new Error('Current brick is not Group Brick');
        }

        const boardNode = brick.getPart('content');

        if (!boardNode) {
            throw new Error('Current brick dont have content part');
        }

        const board = this.getOwnerTemplate().getBoardByNode(boardNode) as LayerBoard;
        const groupBrickTransform: Record<string, BrickTransform> = {};

        const brickIds = board.getBricks().map(brick => {
            const id = brick.id;
            groupBrickTransform[id] = new BrickTransform(board, id);
            return id;
        });

        const res = LayerMark.getBrickGroupRect(brickIds, board, groupBrickTransform);

        return {
            offset: res.offset,
            sizeOffset: res.sizeOffset
        };
    }

    /**
     * 计算当前activeBricks的最大外接矩形
     * 主要用来处理移动过程中辅助线、吸附等功能计算
     */
    private calBricksGroupRect(): void {

        const activeIds = Object.keys(this.activeBrickTransform);

        if (!activeIds.length) {
            this.groupRectPos = null;
        }

        const res = LayerMark.getBrickGroupRect(activeIds, this.board, this.activeBrickTransform);

        const {offset, sizeOffset, transform = getDefaultTransform()} = res;

        this.groupRectPos = {
            offset: new Vector(offset.get()),
            sizeOffset: new Vector(sizeOffset.get()),
            transform,
            start: new Vector(offset.get()),
            startSize: new Vector(sizeOffset.get()),
            startTransform: transform
        };
    }

    private getOwnerTemplate(): EditorTemplate {
        return this.board.getOwnerTemplate();
    }

    /**
     * 将当前board的所有brick拆分
     *
     * @param brickIds
     */
    private splitBrick(brickIds: string[]): void {
        const ids = brickIds.length ? brickIds.slice() : this.getOwnerTemplate().getActiveBrickIds();
        const map = ids.reduce((map: Record<string, boolean>, id) => ({...map, [id]: true}), {});

        this.board.getBricks().forEach(brick => {
            const brickId = brick.id;

            if (map[brickId]) {
                if (brick.getLock()) {

                    return;
                }

                this.activeBrickTransform[brickId] = new BrickTransform(this.board, brickId);

                if (brick.brickType === 'Group') {
                    this.addGroupBrickTransform(brick);
                }
            } else {
                const transform = new BrickTransform(this.board, brickId);
                this.refBrickTransform[brickId] = transform;
                const {offset, sizeOffset} = transform.getTransformRect({
                    ...getDefaultEditorBrickDragInfo(),
                    transform: transform.getStartDragInfo().transform
                });

                const [left, top] = offset.get();
                const [width, height] = sizeOffset.get();

                this.refBrickWrapPosition[brickId] = {
                    left: Math.floor(left),
                    top: Math.floor(top),
                    width: Math.floor(width),
                    height: Math.floor(height),
                    right: Math.floor(left + width),
                    bottom: Math.floor(top + height)
                };
            }

            const {width, height} = this.getOwnerTemplate().getPosition();
            this.refBrickWrapPosition.template = {
                left: 0,
                top: 0,
                width,
                height,
                right: width,
                bottom: height
            };
        });
    }

    /**
     * 收集所有group里的brick的初始信息
     *
     * @param brick
     */
    private addGroupBrickTransform(brick: EditorBrickGlobal): void {
        const brickList: EditorBrickGlobal[] = [brick];

        while (brickList.length) {
            const current = brickList.shift() as EditorBrickGlobal;

            const boardNode = current.getPart('content');

            if (!boardNode) {
                return;
            }

            const board = this.getOwnerTemplate().getBoardByNode(boardNode);

            board.getBricks().forEach(brick => {
                this.groupBrickTransform[brick.id] = new BrickTransform(board as LayerBoard, brick.id);

                if (brick.brickType === 'Group') {
                    brickList.push(brick);
                }
            });
        }
    }

    /**
     * 计算所有x,y方向的辅助线信息
     */
    private calAuxiliaryLine(): void {
        const x: Record<number, true> = {};
        const y: Record<number, true> = {};

        function pushItem(map: Record<number, true>, items: number[]): void {
            items.forEach(item => !map[item] && (map[item] = true));
        }

        getKeys(this.refBrickWrapPosition).forEach(id => {
            const {left, top, width, height, right, bottom} = this.refBrickWrapPosition[id];

            pushItem(x, [Math.floor(top), Math.floor(top + height / 2), Math.floor(bottom)]);
            pushItem(y, [Math.floor(left), Math.floor(left + width / 2), Math.floor(right)]);
        });

        this.auxiliaryLine = {
            x: getKeys(x)
                .map(item => parseInt(String(item), 10))
                .sort((a, b) => a - b),
            y: getKeys(y)
                .map(item => parseInt(String(item), 10))
                .sort((a, b) => a - b)
        };
    }

    /**
     * 吸附并调优偏移
     *
     * @param groupRect
     */
    private getAdsorption(groupRect: IRect): [Vector, IAuxiliaryLine, Vector[]] {
        const adsorption = new LayerAdsorption(groupRect, this.refBrickWrapPosition, this.auxiliaryLine);
        return adsorption.getAdsorption();
    }

    /**
     * 计算等距辅助线信息
     * @param groupRect
     */
    private getEquidistance(groupRect: IRect): IEquidistanceLine {
        const equalDistance = new LayerEquidistance(
            groupRect,
            // 踢出template
            getKeys(this.refBrickWrapPosition).reduce((res: Record<string, IElementPosition>, key: string) => {
                if (key === 'template') {
                    return res;
                }

                res[key] = this.refBrickWrapPosition[key];
                return res;
            }, {})
        );
        return equalDistance.getEquidistance();
    }
}
