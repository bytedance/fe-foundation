/**
 * @file LayerAlign
 */
import {getKeys} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';
import {AlignDirection, IBrickTransformData, IEditorBrickDragInfo, ILayerMarkDragResult} from '../../types';
import {getDefaultEditorBrickDragInfo} from '../../util/brick';
import {BrickTransform} from '../BrickTransform';
import {EditorTemplate} from '../EditorTemplate';
import {LayerBoard} from '../LayerBoard';
import {LayerMark} from './LayerMark';

export type IGetAlignTransformData = (groupRect: IEditorBrickDragInfo, brickId: string) => IBrickTransformData;

export class LayerAlign {

    private readonly board: LayerBoard;

    private activeBrickTransform: Record<string, BrickTransform> = {};

    private activeBrickDragInfo: Record<string, IEditorBrickDragInfo> = {};

    private groupRect: IEditorBrickDragInfo | null = null;

    constructor(board: LayerBoard) {
        this.board = board;
    }

    public align(direction: AlignDirection): ILayerMarkDragResult | null {
        this.getActiveBrickRect();
        this.calBricksGroupRect();

        let res: ILayerMarkDragResult | null = null;

        if (!this.groupRect) {
            return res;
        }

        switch (direction) {
            case AlignDirection.TOP:
                res = this.getAlignResult(this.groupRect, this.alignTopTransformData);
                break;
            case AlignDirection.BOTTOM:
                res = this.getAlignResult(this.groupRect, this.alignBottomTransformData);
                break;
            case AlignDirection.V_CENTER:
                res = this.getAlignResult(this.groupRect, this.alignVCenterTransformData);
                break;
            case AlignDirection.LEFT:
                res = this.getAlignResult(this.groupRect, this.alignLeftTransformData);
                break;
            case AlignDirection.RIGHT:
                res = this.getAlignResult(this.groupRect, this.alignRightTransformData);
                break;
            case AlignDirection.H_CENTER:
                res = this.getAlignResult(this.groupRect, this.alignHCenterTransformData);
                break;
        }

        return res;
    }

    private getOwnerTemplate(): EditorTemplate {
        return this.board.getOwnerTemplate();
    }

    private getActiveBrickRect(): void {
        const bricks = this.getOwnerTemplate().getActiveBricks();

        bricks.forEach(brick => {
            // 加锁元素不参与对齐操作
            if (brick.getLock()) {
                return;
            }

            const id = brick.id;

            const transform = new BrickTransform(this.board, id);
            this.activeBrickTransform[id] = transform;
            this.activeBrickDragInfo[id] = transform.getTransformRect(getDefaultEditorBrickDragInfo());
        });
    }

    private calBricksGroupRect(): void {
        const activeIds = Object.keys(this.activeBrickDragInfo);

        if (activeIds.length < 2) {
            this.groupRect = null;
        }

        this.groupRect = LayerMark.getBrickGroupRect(activeIds, this.board, this.activeBrickTransform);
    }

    private getAlignResult(
        groupRect: IEditorBrickDragInfo,
        getTransformData: IGetAlignTransformData
    ): ILayerMarkDragResult {
        const res: ILayerMarkDragResult = {};

        getKeys(this.activeBrickDragInfo).forEach((id: string) => {
            const transformData = getTransformData(groupRect, id);
            const transform = this.activeBrickTransform[id];
            const info = transform.calcTranslateDragInfo(transformData);

            const [props, oldProps] = transform.getApplyBrickProps(info);
            const commandOption = transform.getSetBrickProp(info);

            res[id] = {props, oldProps, commandOption};
        });

        return res;
    }

    private readonly alignTopTransformData: IGetAlignTransformData = (
        groupRect: IEditorBrickDragInfo,
        brickId: string
    ): IBrickTransformData => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [groupLeft, groupTop] = groupRect.offset.get();
        const {offset: brickOffset} = this.activeBrickDragInfo[brickId];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [brickLeft, brickTop] = brickOffset.get();

        return {
            offset: new Vector([0, groupTop - brickTop]),
            rotate: 0
        };
    };

    private readonly alignBottomTransformData: IGetAlignTransformData = (
        groupRect: IEditorBrickDragInfo,
        brickId: string
    ): IBrickTransformData => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [groupRight, groupBottom] = Vector.addVector(groupRect.offset, groupRect.sizeOffset).get();
        const {offset, sizeOffset} = this.activeBrickDragInfo[brickId];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [brickRight, brickBottom] = Vector.addVector(offset, sizeOffset).get();

        return {
            offset: new Vector([0, groupBottom - brickBottom]),
            rotate: 0
        };
    };

    private readonly alignLeftTransformData: IGetAlignTransformData = (
        groupRect: IEditorBrickDragInfo,
        brickId: string
    ): IBrickTransformData => {
        const [groupLeft] = groupRect.offset.get();
        const {offset: brickOffset} = this.activeBrickDragInfo[brickId];
        const [brickLeft] = brickOffset.get();

        return {
            offset: new Vector([groupLeft - brickLeft, 0]),
            rotate: 0
        };
    };

    private readonly alignRightTransformData: IGetAlignTransformData = (
        groupRect: IEditorBrickDragInfo,
        brickId: string
    ): IBrickTransformData => {
        const [groupRight] = Vector.addVector(groupRect.offset, groupRect.sizeOffset).get();
        const {offset, sizeOffset} = this.activeBrickDragInfo[brickId];
        const [brickRight] = Vector.addVector(offset, sizeOffset).get();

        return {
            offset: new Vector([groupRight - brickRight, 0]),
            rotate: 0
        };
    };

    private readonly alignHCenterTransformData: IGetAlignTransformData = (
        groupRect: IEditorBrickDragInfo,
        brickId: string
    ): IBrickTransformData => {
        const groupSize = new Vector(groupRect.sizeOffset.get());
        groupSize.scale(0.5);
        const [groupCenterLeft] = Vector.addVector(groupRect.offset, groupSize).get();
        const {offset, sizeOffset} = this.activeBrickDragInfo[brickId];

        const brickSize = new Vector(sizeOffset.get());
        brickSize.scale(0.5);
        const [brickCenterLeft] = Vector.addVector(offset, brickSize).get();

        return {
            offset: new Vector([Math.floor(groupCenterLeft - brickCenterLeft), 0]),
            rotate: 0
        };
    };

    private readonly alignVCenterTransformData: IGetAlignTransformData = (
        groupRect: IEditorBrickDragInfo,
        brickId: string
    ): IBrickTransformData => {
        const groupSize = new Vector(groupRect.sizeOffset.get());
        groupSize.scale(0.5);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [groupCenterLeft, groupCenterTop] = Vector.addVector(groupRect.offset, groupSize).get();
        const {offset, sizeOffset} = this.activeBrickDragInfo[brickId];

        const brickSize = new Vector(sizeOffset.get());
        brickSize.scale(0.5);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [brickCenterLeft, brickCenterTop] = Vector.addVector(offset, brickSize).get();

        return {
            offset: new Vector([0, Math.floor(groupCenterTop - brickCenterTop)]),
            rotate: 0
        };
    };
}
