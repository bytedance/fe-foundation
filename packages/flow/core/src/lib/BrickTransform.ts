/**
 * @file BrickTransform
 */
import {ITransform} from '@chief-editor/base';
import {Matrix3D} from '@co-hooks/matrix3d';
import {getKeys} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';
import {
    ApplyBrickProps,
    Direct,
    IBrickTransformData,
    IDaltRect,
    IEditorBrickDragInfo,
    IRect,
    ISetBrickCommandOption,
    ISetBrickProp,
    IStartDragInfo,
    ITransformRectInfo
} from '../types';
import {getDefaultEditorBrickDragInfo, getDefaultTransform} from '../util/brick';
import {
    convertDegToRadians, getAngleForX, getAngleForY,
    getAssistPoints,
    getCenterPointByRect,
    getFixedPoint,
    getFixedPointDirect,
    getPointByLine,
    getPointsByRect,
    getPointsRect
} from '../util/math';
import {EditorBrickGlobal} from './EditorBrick';
import {EditorTemplate} from './EditorTemplate';
import {LayerBoard} from './LayerBoard';

export class BrickTransform {

    private readonly board: LayerBoard;

    private startDragInfo: IStartDragInfo;

    private readonly brick: EditorBrickGlobal;

    constructor(board: LayerBoard, brickId: string) {
        this.board = board;
        this.brick = this.getOwnerTemplate().getBrick(brickId);
        this.startDragInfo = this.initStartDragInfo();
    }

    public updateStartDragInfo(): IStartDragInfo {
        this.startDragInfo = this.initStartDragInfo();
        return this.startDragInfo;
    }

    /**
     * 计算旋转变换的结果
     * @param transformData
     */
    public calcRotateDragInfo(transformData: IBrickTransformData): IEditorBrickDragInfo {
        const {rotate} = transformData;

        const {
            transform: startTransform
        } = this.startDragInfo;

        return {
            ...getDefaultEditorBrickDragInfo(),
            transform: {
                ...startTransform,
                rotate: (startTransform.rotate + rotate + 360) % 360
            }
        };
    }

    /**
     * 计算平移结果
     * @param transformData
     */
    public calcTranslateDragInfo(transformData: IBrickTransformData): IEditorBrickDragInfo {
        const {offset} = transformData;
        return this.correctDragInfoForMoveBrick(offset);
    }

    /**
     * 计算缩放、斜切等变换结果
     * @param transformData
     */
    public calcTransformDragInfo(transformData: IBrickTransformData): IEditorBrickDragInfo | null {
        const {
            offset: startOffset,
            sizeOffset: startSizeOffset,
            transform: startTransform
        } = this.startDragInfo;

        const info = this.getTransformScaledRect(transformData);

        if (!info) {
            return null;
        }

        const [, scaledPoints] = info;

        // 变换参数不会变更，缩放直接应用在宽高上，只需要计算size leftTop偏移量
        const newPoints = this.getRevertPoints(scaledPoints, startTransform);

        const newRect = getPointsRect(newPoints);

        const daltRect = this.getTwoRectOffset(
            {
                offset: startOffset,
                sizeOffset: startSizeOffset
            },
            newRect
        );

        return {
            ...daltRect,
            transform: startTransform
        };
    }

    public getTransformScaledRect(transformData: IBrickTransformData): [IRect, Vector[]] | null {
        const {direct: dir, offset: vector, ratio = false} = transformData;

        const {
            transform: startTransform,
            transformRectInfo: {
                assistPoints,
                relativeOffset,
                sizeOffset
            }
        } = this.startDragInfo;

        if (!dir) {
            return null;
        }

        const fixedDirect = getFixedPointDirect(dir);

        const currentPoint = assistPoints[dir];
        const fixedPoint = getFixedPoint(dir, assistPoints);
        const endPoint = Vector.addVector(currentPoint, vector);

        // 垂向，用y找x，横向 用x找y
        let isVertical = [Direct.TOP, Direct.BOTTOM].indexOf(fixedDirect) > -1;

        const linePoint = getPointByLine(
            fixedPoint,
            currentPoint,
            isVertical ? endPoint.getY() : endPoint.getX(), !isVertical
        ) || new Vector([currentPoint.getX(), endPoint.getY()]);

        const centerPoint = getCenterPointByRect({offset: relativeOffset, sizeOffset});
        // const [centerX, centerY] = centerPoint.get();

        const targetPoint = [Direct.TOP, Direct.LEFT, Direct.BOTTOM, Direct.RIGHT].indexOf(fixedDirect) > -1
            ? linePoint
            : endPoint;

        const transformMatrix = this.getRevertMatrix(centerPoint, startTransform);

        const revertCurrentPoint = transformMatrix.mulVector(currentPoint);
        const revertFixedPoint = transformMatrix.mulVector(fixedPoint);
        const revertTargetPoint = transformMatrix.mulVector(targetPoint);

        if (!this.isValidTransform(dir, revertFixedPoint, revertTargetPoint)) {
            return null;
        }

        const [currentX, currentY] = revertCurrentPoint.get();
        const [fixedX, fixedY] = revertFixedPoint.get();
        const [endX, endY] = revertTargetPoint.get();

        let scaleX = Math.abs(currentX - fixedX) < 1
            ? 1
            : (endX - fixedX) / (currentX - fixedX);

        let scaleY = Math.abs(currentY - fixedY) < 1
            ? 1
            : (endY - fixedY) / (currentY - fixedY);

        // TODO 等比计算
        if (ratio) {
            scaleX = scaleY = Math.min(scaleX, scaleY);
        }

        const scaledPoints = this.getScaledPoints(fixedPoint, centerPoint, scaleX, scaleY);

        // TODO scaleRect做吸附功能
        const scaleRect = getPointsRect(scaledPoints);

        return [scaleRect, scaledPoints];
    }

    public getApplyBrickProps(dragInfo: IEditorBrickDragInfo): [ApplyBrickProps, ApplyBrickProps] {
        const startInfo = this.startDragInfo;
        const brick = this.brick;

        let {vertical, horizontal} = brick.layout;
        const {
            offset: startOffset,
            sizeOffset: startSizeOffset,
            transform: startTransform
        } = startInfo;
        const {offset, sizeOffset} = dragInfo;
        const {width: boxWidth, height: boxHeight} = this.board.getPosition();

        const [oldLeft, oldTop] = startOffset.get();
        const [oldWidth, oldHeight] = startSizeOffset.get();
        const [left, top] = Vector.addVector(startOffset, offset).get();
        let [width, height] = Vector.addVector(startSizeOffset, sizeOffset).get();
        const [daltWidth, daltHeight] = sizeOffset.get();

        width = Math.floor(width);
        height = Math.floor(height);
        const right = Math.floor(boxWidth - left - width);
        const bottom = Math.floor(boxHeight - top - height);
        const oldRight = Math.floor(boxWidth - oldLeft - oldWidth);
        const oldBottom = Math.floor(boxHeight - oldTop - oldHeight);

        const props: Record<string, any> = {};
        const oldProps: Record<string, any> = {};

        switch (vertical) {
            case 'top':
            case 'dock':
                props.top = Math.floor(top);
                oldProps.top = Math.floor(oldTop);
                break;
            case 'bottom':
                props.bottom = bottom;
                oldProps.bottom = oldBottom;
                break;
            case 'center':
                props.top = Math.floor(top - daltHeight / 2);
                oldProps.top = Math.floor(oldTop);
                break;
        }

        switch (horizontal) {
            case 'left':
            case 'dock':
                props.left = Math.floor(left);
                oldProps.left = Math.floor(oldLeft);
                break;
            case 'right':
                props.right = right;
                oldProps.right = oldRight;
                break;
            case 'center':
                props.left = Math.floor(left - daltWidth / 2);
                oldProps.left = Math.floor(oldLeft);
                break;
        }

        return [
            {
                ...props,
                width,
                height,
                ...dragInfo.transform
            },
            {
                ...oldProps,
                width: oldWidth,
                height: oldHeight,
                ...startTransform
            }
        ];
    }

    public getSetBrickProp(dragInfo: IEditorBrickDragInfo): ISetBrickCommandOption | null {
        const [props, oldProps] = this.getApplyBrickProps(dragInfo);
        const startInfo = this.startDragInfo;

        if (!startInfo) {
            return null;
        }

        const propList: ISetBrickProp[] = [];

        getKeys(props).forEach(key => {
            propList.push({
                key: `layout.${key}`,
                oldValue: oldProps[key],
                value: props[key]
            });
        });

        return {
            brickId: this.brick.id,
            props: propList
        };
    }

    public getStartDragInfo(): IStartDragInfo {
        return this.startDragInfo;
    }

    public getTransformRect(
        info: IEditorBrickDragInfo,
        startDragInfo: IStartDragInfo = this.startDragInfo
    ): ITransformRectInfo {
        const {
            absVector,
            offset: startOffset,
            sizeOffset: startSize,
            transform: startTransform
        } = startDragInfo;

        const {offset, sizeOffset, transform: infoTransform} = info;

        const transform = infoTransform || startTransform || getDefaultTransform();

        const size = Vector.addVector(startSize, sizeOffset);
        const rotate = infoTransform.rotate;

        const absRect = {offset: Vector.addVector(absVector, offset), sizeOffset: size};
        const absPoints = getPointsByRect(absRect);
        const absCenter = getCenterPointByRect(absRect);

        const absTransformedPoints = absPoints.map(point =>
            this.getRotatedAndTransformVector(point, absCenter, rotate, transform)
        );

        const absTransformRect = getPointsRect(absTransformedPoints);

        const relativeRect = {offset: Vector.addVector(startOffset, offset), sizeOffset: size};

        const relativePoints = getPointsByRect(relativeRect);
        const relativeCenter = getCenterPointByRect(relativeRect);
        const relativeTransformedPoints = relativePoints.map(point =>
            this.getRotatedAndTransformVector(point, relativeCenter, rotate, transform)
        );

        const relativeTransformedRect = getPointsRect(relativeTransformedPoints);

        return {
            offset: absTransformRect.offset,
            sizeOffset: absTransformRect.sizeOffset,
            transform: getDefaultTransform(),
            points: relativeTransformedPoints,
            assistPoints: getAssistPoints(relativeTransformedPoints),
            relativeOffset: relativeTransformedRect.offset
        };
    }

    public calcDragInfoByScaleTransformRect(scaleVector: Vector): IEditorBrickDragInfo {
        const scaledPoints = this.getScaledPointsByInnerScale(scaleVector);

        const scaledRect = getPointsRect(scaledPoints);
        const scaledCenter = getCenterPointByRect(scaledRect);

        const newTransform = this.getNewTransformByPoints(scaledPoints);
        const revertMatrix = this.getRevertMatrix(scaledCenter, newTransform);

        const revertScaledPoints = scaledPoints.map(point => revertMatrix.mulVector(point));

        const revertScaledRect = getPointsRect(revertScaledPoints);

        const daltRect = this.getTwoRectOffset({
            offset: this.startDragInfo.offset,
            sizeOffset: this.startDragInfo.sizeOffset
        }, revertScaledRect);

        return {
            ...daltRect,
            transform: newTransform
        };
    }

    /**
     * 根据现有外接矩形和 双向缩放比例，计算新的外接矩形
     * @param scaleVector
     */
    public getScaledPointsByInnerScale(
        scaleVector: Vector
    ): Vector[] {
        const {transformRectInfo: {relativeOffset, points}} = this.startDragInfo;

        const relativePoints = points.map(point => Vector.subVector(point, relativeOffset));

        const scaleMatrix = Matrix3D.scaleMatrix3D(scaleVector);

        const relativeScaledPoints = relativePoints.map(point => scaleMatrix.mulVector(point));

        const scaledPoints = relativeScaledPoints.map(point => Vector.addVector(point, relativeOffset));

        return scaledPoints;
    }

    /**
     * 计算元素四角在自身元素中心旋转一定角度后的向量
     *
     * @param point 点向量
     * @param centerPoint zhong
     * @param rotate 旋转角度
     */
    private getRotatedVector(
        point: Vector,
        centerPoint: Vector,
        rotate: number
    ): Vector {

        const deg = convertDegToRadians(rotate);

        const rotateMatrix = Matrix3D.rotateMatrix3D(deg);
        const relativeCenterVector = Vector.subVector(point, centerPoint);

        const relativeCenterRotatedVector = rotateMatrix.mulVector(relativeCenterVector);

        return Vector.addVector(point, Vector.subVector(relativeCenterRotatedVector, relativeCenterVector));
    }

    private getRotatedAndTransformVector(
        point: Vector,
        centerPoint: Vector,
        rotate: number,
        transform?: ITransform
    ): Vector {
        const rotateRadians = convertDegToRadians(rotate);
        const [cx, cy] = centerPoint.get();

        const {scaleX, scaleY, skewX} = transform || getDefaultTransform();

        const identityMatrix = Matrix3D.identityMatrix3D();

        const matrix = identityMatrix;

        matrix.translateO(-cx, -cy);
        matrix.scaleO(scaleX, scaleY);
        matrix.skewO(convertDegToRadians(skewX), 0);
        matrix.rotateO(rotateRadians);
        matrix.translateO(cx, cy);

        return matrix.mulVector(point);
    }

    private getOwnerTemplate(): EditorTemplate {
        return this.board.getOwnerTemplate();
    }

    private initStartDragInfo(): IStartDragInfo {
        const info = this.brick.getBrickRectInfo();
        const absVector = this.brick.getAbsoluteVector();

        const {vector, width, height, transform} = info;

        const start = {
            absVector,
            offset: vector,
            sizeOffset: new Vector([width, height]),
            transform
        };

        return {
            ...start,
            transformRectInfo: this.getTransformRect(
                {
                    ...getDefaultEditorBrickDragInfo(),
                    transform
                },
                start as IStartDragInfo
            )
        };
    }

    /**
     * 更正因为旋转操作宽高变更导致left top偏移
     *
     * @param vector 操作偏移向量
     * @param rotateVector 旋转成正坐标系的偏移向量
     * @param sizeVector rect size的偏移量
     * @param deg 旋转角度
     */
    private correctOffsetVector(vector: Vector, rotateVector: Vector, sizeVector: Vector, deg: number): Vector {
        // 正坐标系时的偏移量
        const [left, top] = rotateVector.get();
        // rect size的偏移量，恒定为正值
        const [width, height] = sizeVector.get();
        const newVec = new Vector();

        // 宽度为0, 这么拉的是上下线
        if (!width) {
            // 纵向单位向量旋转deg角度 * 高度 = 平行于旋转坐标系的高度向量
            const vec = new Vector([-Math.sin(deg) * height, Math.cos(deg) * height]);
            // 移动top导致的高度增高，向量取反，也就是移动的上边位置
            if (top * height < 0) {
                vec.scale(-1);
            }
            newVec.add(vec);
        }

        // 高度为0，证明拉的是左右线
        if (!height) {
            // 横向向单位向量旋转deg角度 * 高度 = 平行于旋转坐标系的宽度向量
            const vec = new Vector([width * Math.cos(deg), width * Math.sin(deg)]);
            // 移动left导致的宽度增加，向量取反，也就是移动左边位置
            if (left * width < 0) {
                vec.scale(-1);
            }

            newVec.add(vec);
        }

        const res = Vector.subVector(newVec.getLength() ? newVec : vector, sizeVector);
        res.scale(0.5);
        return res;
    }

    private correctDragInfoForMoveBrick(offset: Vector): IEditorBrickDragInfo {
        const brick = this.brick;
        const {vertical, horizontal} = brick.layout;

        const newInfo = {
            ...getDefaultEditorBrickDragInfo(),
            transform: this.startDragInfo.transform
        };
        const [x, y] = offset.get();

        if (vertical !== 'dock' && horizontal !== 'dock') {
            newInfo.offset = offset;
        } else if (vertical === 'dock' && horizontal !== 'dock') {
            newInfo.offset.add(new Vector([x, 0]));
        } else if (vertical !== 'dock' && horizontal === 'dock') {
            newInfo.offset.add(new Vector([0, y]));
        }

        return newInfo;
    }

    private isValidTransform(direct: Direct, fixedPoint: Vector, endPoint: Vector): boolean {
        const [fixedX, fixedY] = fixedPoint.get();
        const [endX, endY] = endPoint.get();

        if (~[Direct.TOP, Direct.BOTTOM].indexOf(direct)) {
            if (Math.abs(endY - fixedY) < 1) {
                return false;
            }
        } else if (~[Direct.LEFT, Direct.RIGHT].indexOf(direct)) {
            if (Math.abs(endX - fixedX) < 1) {
                return false;
            }
        } else {
            if (Math.abs(endX - fixedX) < 1 || Math.abs(endY - fixedY) < 1) {
                return false;
            }
        }

        return true;
    }

    private getScaledPoints(fixedPoint: Vector, centerPoint: Vector, scaleX: number, scaleY: number): Vector[] {
        const {
            transform: startTransform,
            offset: startOffset,
            sizeOffset: startSizeOffset
        } = this.startDragInfo;
        const [centerX, centerY] = centerPoint.get();
        const {skewX, scaleX: startSX, scaleY: startSY, rotate: startRotate} = startTransform;
        const startRotateRadians = convertDegToRadians(startRotate);

        const revertMatrix = this.getRevertMatrix(centerPoint, startTransform);

        const originFixedPoint = revertMatrix.mulVector(fixedPoint);
        const [originX, originY] = originFixedPoint.get();

        const newMatrix = Matrix3D.identityMatrix3D()
            .translateO(-centerX, -centerY)
            .translateO(-(originX - centerX), -(originY - centerY))
            .scaleO(scaleX, scaleY)
            .translateO(originX - centerX, originY - centerY)
            // .translateO(-centerX, -centerY)
            .scaleO(startSX, startSY)
            .skewO(convertDegToRadians(skewX), 0)
            .rotateO(startRotateRadians)
            .translateO(centerX, centerY);

        const originPoints = getPointsByRect({offset: startOffset, sizeOffset: startSizeOffset});

        const scaledPoints = originPoints.map(point => newMatrix.mulVector(point));

        return scaledPoints;
    }

    /**
     * 根据4个顶点计算新rotate skewX
     * @param points
     * @return [rotate, skewX]
     */
    private getNewTransformByPoints(points: Vector[]): ITransform {
        const {transform} = this.startDragInfo;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [leftTop, rightTop, rightBottom, leftBottom] = points;
        const [leftTopX, leftTopY] = leftTop.get();

        const angle = getAngleForX(Vector.subVector(rightTop, leftTop));
        const angleRadians = convertDegToRadians(angle);

        const rotate = Math.round(angle);

        const rotateMatrix = Matrix3D.identityMatrix3D()
            .translateO(-leftTopX, -leftTopY)
            .rotateO(-angleRadians)
            .translateO(leftTopX, leftTopY);

        const rotatedLeftBottom = rotateMatrix.mulVector(leftBottom);

        const skewX = getAngleForY(Vector.subVector(rotatedLeftBottom, leftTop));

        return {
            ...transform,
            skewX,
            rotate
        };
    }

    /**
     * 已知变换后的点，获取变换前的点
     * @param points
     * @param transform
     */
    private getRevertPoints(points: Vector[], transform: ITransform): Vector[] {

        const rect = getPointsRect(points);
        const centerPoint = getCenterPointByRect(rect);

        const matrix = this.getRevertMatrix(centerPoint, transform);

        const revertPoints = points.map(point => matrix.mulVector(point));

        return revertPoints;
    }

    /**
     * 根据中心点和变换参数，计算反变换矩阵
     * @param center
     * @param transform
     */
    private getRevertMatrix(center: Vector, transform: ITransform): Matrix3D {
        const {skewX, rotate = 0, scaleX, scaleY} = transform;
        const [centerX, centerY] = center.get();

        return Matrix3D.identityMatrix3D()
            .translateO(-centerX, -centerY)
            .rotateO(-convertDegToRadians(rotate))
            .skewO(-convertDegToRadians(skewX), 0)
            .scaleO(scaleX, scaleY)
            .translateO(centerX, centerY);
    }

    private getTwoRectOffset(originRect: IRect, newRect: IRect): IDaltRect {
        const {offset: originOffset, sizeOffset: originSize} = originRect;
        const {offset: newOffset, sizeOffset: newSize} = newRect;

        return {
            offset: Vector.subVector(newOffset, originOffset),
            sizeOffset: Vector.subVector(newSize, originSize)
        };
    }
}
