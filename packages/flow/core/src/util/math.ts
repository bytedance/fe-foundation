/**
 * @file math
 */
import {ITransform} from '@chief-editor/base';
import {Vector} from '@co-hooks/vector';
import {Matrix3D} from '@co-hooks/matrix3d';
import {Direct, IRect} from '../types';

export function getAngleForX(vector: Vector): number {
    const [x, y] = vector.get();

    return convertRadiansToDeg(Math.atan2(y, x));
}

export function getAngleForY(vector: Vector): number {
    const [x, y] = vector.get();

    return convertRadiansToDeg(Math.atan2(x, y));
}

// 角度转圆周率小数
export function convertDegToRadians(deg: number): number {
    return deg / 180 * Math.PI;
}

// 圆周率小数转角度
export function convertRadiansToDeg(radians: number): number {
    return radians * 180 / Math.PI;
}

export function getTransformMatrix(transform: ITransform, centerPoint: Vector): Matrix3D {
    const {scaleX, scaleY, skewX, rotate} = transform;
    const skewXRadians = Math.tan(convertDegToRadians(skewX));
    const [centerX, centerY] = centerPoint.get();
    return Matrix3D.identityMatrix3D()
        .translateO(-centerX, -centerY)
        .scaleO(scaleX, scaleY)
        .skewO(skewXRadians, 0)
        .rotateO(convertDegToRadians(rotate))
        .translateO(centerX, centerY);
}

export function getPointsByRect(rect: IRect): Vector[] {
    const {sizeOffset, offset} = rect;

    const [left, top] = offset.get();
    const [width, height] = sizeOffset.get();

    const leftTop = new Vector([left, top]);
    const rightTop = new Vector([left + width, top]);
    const rightBottom = new Vector([left + width, top + height]);
    const leftBottom = new Vector([left, top + height]);

    return [leftTop, rightTop, rightBottom, leftBottom];
}

export function getCenterPointByRect(rect: IRect): Vector {
    const {sizeOffset, offset} = rect;
    return Vector.addVector(offset, Vector.scaleVector(sizeOffset, 0.5));
}

export function getPointsRect(points: Vector[]): IRect {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    points.forEach(point => {
        const [x, y] = point.get();
        xMin = Math.min(xMin, x);
        xMax = Math.max(xMax, x);
        yMin = Math.min(yMin, y);
        yMax = Math.max(yMax, y);
    });

    return {
        offset: new Vector([xMin, yMin]),
        sizeOffset: new Vector([Math.abs(xMax - xMin), Math.abs(yMax - yMin)])
    };
}

export function getDefaultRect(): IRect {
    return {
        offset: new Vector(),
        sizeOffset: new Vector()
    };
}

/**
 * 获取多个元素的外接矩形
 * @param rectList
 */
export function getPolygonsRectByRectList(rectList: IRect[]): IRect {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    rectList.map(rect => {
        const {offset, sizeOffset} = rect;
        const [left, top] = offset.get();
        const [right, bottom] = Vector.addVector(offset, sizeOffset).get();

        xMin = Math.min(xMin, left);
        xMax = Math.max(xMax, right);
        yMin = Math.min(yMin, top);
        yMax = Math.max(yMax, bottom);
    });

    return {
        offset: new Vector([xMin, yMin]),
        sizeOffset: new Vector([Math.abs(xMax - xMin), Math.abs(yMax - yMin)])
    };
}

const symmetricDirectMap = {
    [Direct.LEFT]: Direct.RIGHT,
    [Direct.TOP]: Direct.BOTTOM,
    [Direct.RIGHT]: Direct.LEFT,
    [Direct.BOTTOM]: Direct.TOP,
    [Direct.LEFT_TOP]: Direct.RIGHT_BOTTOM,
    [Direct.RIGHT_BOTTOM]: Direct.LEFT_TOP,
    [Direct.LEFT_BOTTOM]: Direct.RIGHT_TOP,
    [Direct.RIGHT_TOP]: Direct.LEFT_BOTTOM
};

export function getFixedPoint(direct: Direct, assistPoints: Record<Direct, Vector>): Vector {
    return assistPoints[getFixedPointDirect(direct)];
}

export function getFixedPointDirect(direct: Direct): Direct {
    return symmetricDirectMap[direct];
}

export function getAssistPoints(points: Vector[]): Record<Direct, Vector> {
    const [leftTop, rightTop, rightBottom, leftBottom] = points;

    return {
        leftTop,
        rightTop,
        rightBottom,
        leftBottom,
        top: Vector.addVector(leftTop, Vector.subVector(rightTop, leftTop).scale(0.5)),
        right: Vector.addVector(rightTop, Vector.subVector(rightBottom, rightTop).scale(0.5)),
        left: Vector.addVector(leftTop, Vector.subVector(leftBottom, leftTop).scale(0.5)),
        bottom: Vector.addVector(leftBottom, Vector.subVector(rightBottom, leftBottom).scale(0.5))
    };
}

export function getSlopByTwoPoints(p1: Vector, p2: Vector): number {
    const [x1, y1] = p1.get();
    const [x2, y2] = p2.get();

    const daltX = x2 - x1;
    const daltY = y2 - y1;

    if (daltX === 0) {
        return Infinity;
    }

    return daltY / daltX;
}

export function getLineParams(p1: Vector, p2: Vector): {k: number; b: number} | null {
    const [x1, y1] = p1.get();
    const [x2, y2] = p2.get();

    const daltX = x2 - x1;
    const daltY = y2 - y1;

    if (daltX === 0) {
        return null;
    }

    return {
        k: daltY / daltX,
        b: y1 - daltY / daltX * x1
    };
}

export function getPointByLine(p1: Vector, p2: Vector, num: number, isX: boolean): Vector | null {
    const params = getLineParams(p1, p2);

    if (!params) {
        return null;
    }

    const {k, b} = params;

    if (isX) {
        return new Vector([num, k * num + b]);
    }

    return new Vector([(num - b) / k, num]);
}

/**
 * 已知中心点，起始点，计算旋转角度
 * @param center 相对画板的中心点向量
 * @param start 相对画板的起点向量
 * @param end 相对画板的终点向量
 * @return -179 ~ 180
 */
export function getRotate(center: Vector, start: Vector, end: Vector): number {
    let relativeCenterStart = Vector.subVector(start, center);
    let relativeCenterEnd = Vector.subVector(end, center);

    const startAngle = getAngleForX(relativeCenterStart);
    const endAngle = getAngleForX(relativeCenterEnd);

    return endAngle - startAngle;
}
