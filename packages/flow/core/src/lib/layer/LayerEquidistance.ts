/**
 * @file LayerEqualDistance
 */
import {IElementPosition} from '@co-hooks/dom';
import {getKeys} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';
import {IEquidistanceDataInfo, IEquidistanceLine, IEquidistanceLineItem, IRect} from '../../types';

export interface IDaltInfo {
    dalt: number;
    index: number;
}

export class LayerEquidistance {
    private readonly refWrapper: Record<string, IElementPosition>;

    private readonly groupRect: IRect;

    constructor(groupRect: IRect, refWrapper: Record<string, IElementPosition>) {
        this.groupRect = groupRect;
        this.refWrapper = refWrapper;
    }

    public getEquidistance(): IEquidistanceLine {
        const res: IEquidistanceLine = {x: [], y: []};

        const refIds = getKeys(this.refWrapper);

        // 对比元素小于2个，不存在等距
        if (refIds.length < 2) {
            return res;
        }

        res.x = this.calcEquidistanceX();
        res.y = this.calcEquidistanceY();

        return res;
    }

    private calcEquidistanceY(): IEquidistanceLineItem[] {
        const dataInfo: Record<string, IEquidistanceDataInfo> = {};

        getKeys(this.refWrapper).forEach(id => {
            const {top, bottom, left, right} = this.refWrapper[id];
            dataInfo[id] = {
                min: top,
                max: bottom,
                vMin: left,
                vMax: right
            };
        });

        const {offset, sizeOffset} = this.groupRect;
        const [left, top] = offset.get();
        const [right, bottom] = Vector.addVector(offset, sizeOffset).get();

        return this.calcEquidistance(
            dataInfo,
            {
                min: top,
                max: bottom,
                vMin: left,
                vMax: right
            }
        );
    }

    private calcEquidistanceX(): IEquidistanceLineItem[] {
        const dataInfo: Record<string, IEquidistanceDataInfo> = {};

        getKeys(this.refWrapper).forEach(id => {
            const {top, bottom, left, right} = this.refWrapper[id];
            dataInfo[id] = {
                min: left,
                max: right,
                vMin: top,
                vMax: bottom
            };
        });

        const {offset, sizeOffset} = this.groupRect;
        const [left, top] = offset.get();
        const [right, bottom] = Vector.addVector(offset, sizeOffset).get();

        return this.calcEquidistance(
            dataInfo,
            {
                min: left,
                max: right,
                vMin: top,
                vMax: bottom
            }
        );
    }

    private calcEquidistance(
        dataInfo: Record<string, IEquidistanceDataInfo>,
        curInfo: IEquidistanceDataInfo
    ): IEquidistanceLineItem[] {
        const list: IEquidistanceDataInfo[] = [];

        const {min: curMin, max: curMax, vMin: curVMin, vMax: curVMax} = curInfo;
        getKeys(dataInfo).forEach(id => {
            const {min, max, vMin, vMax} = dataInfo[id];

            // 垂向不重叠
            if (curVMin > vMax || curVMax < vMin) {
                return;
            }

            // 当前方向不重叠
            if (max < curMin || min > curMax) {
                list.push(dataInfo[id]);
            }
        });

        list.push(curInfo);
        list.sort((a, b) => a.min - b.min);

        const curIndex = list.indexOf(curInfo);

        const daltList: IDaltInfo[] = list.reduce((res: IDaltInfo[], item, i) => {
            if (i < curIndex) {
                res.push({
                    dalt: curMin - item.max,
                    index: i
                });
            } else if (i > curIndex) {
                res.push({
                    dalt: item.min - curMax,
                    index: i
                });
            }
            return res;
        }, []);

        daltList.sort((a, b) => a.dalt - b.dalt);

        let equidistance: IEquidistanceLineItem[] = [];

        daltList.some(item => {
            const {dalt, index} = item;

            const result = [
                ...this.getAllEquidistance(list, dalt, index, 0),
                ...this.getAllEquidistance(list, dalt, index, list.length - 1)
            ];

            if (result.length > 1) {
                equidistance = [
                    ...result
                ];
                return true;
            }
        });

        const map: Record<string, boolean> = {};

        return equidistance.filter(item => {
            const {vPos, start, end} = item;
            const key = [vPos, start, end].join('_');

            if (map[key]) {
                return false;
            }

            map[key] = true;

            return true;
        });

    }

    /**
     * 已知距离，计算等距线位置
     * @param list
     * @param dalt
     * @param start
     * @param end
     */
    private getAllEquidistance(
        list: IEquidistanceDataInfo[],
        dalt: number,
        start: number,
        end: number
    ): IEquidistanceLineItem[] {
        if (start === end) {
            return [];
        }

        const res: IEquidistanceLineItem[] = [];
        const startItem = list[start];

        // 向上查找
        if (start > end) {
            for (let i = start - 1; i >= end; i--) {
                let curDalt = startItem.min - list[i].max;

                if (curDalt > dalt) {
                    break;
                } else if (curDalt === dalt) {
                    // 计算垂向的定位
                    let vPos = Math.ceil(
                        (Math.min(list[i].vMax, startItem.vMax) + Math.max(list[i].vMin, startItem.vMin)) / 2
                    );
                    res.push({
                        vPos,
                        start: list[i].max,
                        end: startItem.min
                    });

                    res.push(...this.getAllEquidistance(list, dalt, i, end));
                }
            }
        } else {
            // 向下查找
            for (let j = start + 1; j <= end; j++) {
                let curDalt = list[j].min - startItem.max;

                if (curDalt > dalt) {
                    break;
                } else if (curDalt === dalt) {
                    let vPos = Math.ceil(
                        (Math.min(list[j].vMax, startItem.vMax) + Math.max(list[j].vMin, startItem.vMin)) / 2
                    );
                    res.push({
                        vPos,
                        start: startItem.max,
                        end: list[j].min
                    });

                    res.push(...this.getAllEquidistance(list, dalt, j, end));
                }
            }
        }

        return res;
    }
}
