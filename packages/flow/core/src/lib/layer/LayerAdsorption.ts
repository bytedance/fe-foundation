/**
 * @file LayerAdsorption
 */
import {IElementPosition} from '@co-hooks/dom';
import {Vector} from '@co-hooks/vector';
import {clone, getKeys} from '@co-hooks/util';
import {
    IAdsorptionList,
    IAuxiliaryLine,
    IRect
} from '../../types';

export function getDefaultAuxiliaryLine(): IAuxiliaryLine {
    return {
        x: [],
        y: []
    };
}

export class LayerAdsorption {

    /**
     * 计算吸附的优先级，返回吸附的值、偏移量、辅助线位置
     *
     * @param adsorptionList
     * @param targetLine
     */
    private static dealAdsorptionLevel(
        adsorptionList: IAdsorptionList,
        targetLine: number[]
    ): [number | null, number[]] {
        const {
            start: [startLine, startEqual],
            center: [centerLine, centerEqual],
            end: [endLine, endEqual]
        } = adsorptionList;
        const [targetStart, targetCenter, targetEnd] = targetLine;
        let lines: Array<number | null> = [];
        let offset: number | null = null;

        if (startEqual) {
            lines.push(startLine);

            centerEqual && lines.push(centerLine);
            endEqual && lines.push(endLine);
        } else if (centerEqual) {
            lines.push(centerLine);

            endEqual && lines.push(endLine);
        } else if (endEqual) {
            lines.push(endLine);
        } else {


            if (startLine != null) {
                const startOffset = startLine - targetStart;

                offset = startOffset;
                lines.push(startLine);

                // 吸附后对齐的辅助线
                centerLine != null && startOffset === centerLine - targetCenter && lines.push(centerLine);
                endLine != null && startOffset === endLine - targetEnd && lines.push(endLine);
            } else if (centerLine != null) {
                const centerOffset = centerLine - targetCenter;

                offset = centerOffset;
                lines.push(centerLine);

                // 吸附后对齐的辅助线
                endLine != null && centerOffset === endLine - targetEnd && lines.push(endLine);
            } else if (endLine != null) {
                offset = endLine - targetEnd;
                lines.push(endLine);
            }
        }

        return [offset, lines.filter(line => line != null) as number[]];
    }

    /**
     * 吸附检测
     * @return 返回吸附的数值及是否完全相等
     */
    private static detectAdsorption(lines: number[], detectNum: number): [number | null, boolean] {
        let list: number[] = lines.slice();
        let success = false;
        let equal = false;
        let num: number | null = null;

        while (list.length && !success) {
            const center = Math.floor(list.length / 2);
            const detect = list[center];

            if (detectNum < detect - 2) {
                list = list.slice(0, center);
                continue;
            }

            if (detectNum > detect + 2) {
                list = list.slice(center + 1, list.length);
                continue;
            }

            num = detect;

            if (detectNum === detect) {
                equal = true;
            }

            break;
        }

        return [num, equal];
    }

    private readonly refBrickWrapPosition: Record<string, IElementPosition>;

    private readonly groupRect: IRect;

    private readonly auxiliaryLine: IAuxiliaryLine;

    constructor(
        groupRect: IRect,
        refBrickWrapPosition: Record<string, IElementPosition>,
        auxiliaryLine: IAuxiliaryLine
    ) {
        this.groupRect = groupRect;
        this.refBrickWrapPosition = refBrickWrapPosition;
        this.auxiliaryLine = auxiliaryLine;
    }

    public getAdsorption(): [Vector, IAuxiliaryLine, Vector[]] {
        const {offset, sizeOffset} = this.groupRect;
        const [left, top] = offset.get();
        const [width, height] = sizeOffset.get();
        const right = left + width;
        const bottom = top + height;

        const xCenter = top + height / 2;
        const yCenter = left + width / 2;

        const res: IAuxiliaryLine = getDefaultAuxiliaryLine();

        const [xOffset, xLines] = LayerAdsorption.dealAdsorptionLevel(
            {
                start: LayerAdsorption.detectAdsorption(this.auxiliaryLine.x, top),
                center: LayerAdsorption.detectAdsorption(this.auxiliaryLine.x, xCenter),
                end: LayerAdsorption.detectAdsorption(this.auxiliaryLine.x, bottom)
            },
            [top, xCenter, bottom]
        );

        const [yOffset, yLines] = LayerAdsorption.dealAdsorptionLevel(
            {
                start: LayerAdsorption.detectAdsorption(this.auxiliaryLine.y, left),
                center: LayerAdsorption.detectAdsorption(this.auxiliaryLine.y, yCenter),
                end: LayerAdsorption.detectAdsorption(this.auxiliaryLine.y, right)
            },
            [left, yCenter, right]
        );

        const newVec = new Vector([yOffset || 0, xOffset || 0]);

        Object.assign(res, {
            x: xLines,
            y: yLines
        });

        const points = this.getAuxiliaryPoint(xLines, yLines, {
            ...this.groupRect,
            offset: Vector.addVector(this.groupRect.offset, newVec)
        });

        return [newVec, res, points];
    }

    /**
     * 计算辅助点
     *
     * @param xLines 平行于X轴的辅助线
     * @param yLines 平行于Y轴的辅助线
     * @param groupRect 当前外接矩形
     */
    private getAuxiliaryPoint(xLines: number[], yLines: number[], groupRect: IRect): Vector[] {
        const xMap: Record<number, boolean> = xLines.reduce((res, item) => ({...res, [item]: true}), {});
        const yMap: Record<number, boolean> = yLines.reduce((res, item) => ({...res, [item]: true}), {});

        const res: Vector[] = [];
        const pointsMap: Record<string, boolean> = {};

        // 添加辅助点
        function addPoints(
            map: Record<number, boolean>,
            mapItem: number,
            isX: boolean,
            verticalItem: number
        ): void {
            if (isX) {
                const key = `${verticalItem}_${mapItem}`;

                if (!pointsMap[key]) {
                    pointsMap[key] = true;
                    res.push(new Vector([verticalItem, mapItem]));
                }
                return;
            }

            const key = `${mapItem}_${verticalItem}`;

            if (pointsMap[key]) {
                return;
            }

            pointsMap[key] = true;
            res.push(new Vector([mapItem, verticalItem]));
        }

        const refBrickWrapPosition = clone(this.refBrickWrapPosition);

        const {offset, sizeOffset} = groupRect;
        const [left, top] = offset.get();
        const [width, height] = sizeOffset.get();
        const [right, bottom] = Vector.addVector(offset, sizeOffset).get();

        refBrickWrapPosition.groupRect = {left, top, right, bottom, width, height};

        getKeys(refBrickWrapPosition).forEach((id: string) => {
            const {left, top, width, height, right, bottom} = refBrickWrapPosition[id];
            const hCenter = Math.floor(left + width / 2);
            const vCenter = Math.floor(top + height / 2);

            if (xMap[top]) {
                addPoints(xMap, top, true, left);
                addPoints(xMap, top, true, right);
            }

            if (xMap[bottom]) {
                addPoints(xMap, bottom, true, left);
                addPoints(xMap, bottom, true, right);
            }

            if (xMap[vCenter]) {
                addPoints(xMap, vCenter, true, left);
                addPoints(xMap, vCenter, true, right);
                addPoints(xMap, vCenter, true, hCenter);
            }

            if (yMap[left]) {
                addPoints(yMap, left, false, top);
                addPoints(yMap, left, false, bottom);
            }

            if (yMap[right]) {
                addPoints(yMap, right, false, top);
                addPoints(yMap, right, false, bottom);
            }

            if (yMap[hCenter]) {
                addPoints(yMap, hCenter, false, top);
                addPoints(yMap, hCenter, false, bottom);
                addPoints(yMap, hCenter, false, vCenter);
            }
        });


        return res;
    }
}
