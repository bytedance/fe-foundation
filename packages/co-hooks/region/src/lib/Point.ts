/**
 * @file Point 单一数字端点
 */

import {IOffset, getDefaultOffset} from '@co-hooks/dom';
import {Emitter} from '@co-hooks/emitter';
import {AxisType, PointType} from '../enum';
import {Axis} from './Axis';
import {IRegion} from './Region';

export interface IPointEvents {
    'repaint': [];
}

export interface IPrecisionOffset {
    x: string;
    y: string;
}

export class Point extends Emitter<IPointEvents> {

    // 实际坐标偏移量，实际坐标是一个(0, 0) ->(x.length, y.length)的封闭连续区域
    private offset: IOffset = getDefaultOffset();

    // 所属区域
    private readonly region: IRegion;

    // 端点类型
    private readonly type: PointType;

    // 端点名称
    private readonly name: string;

    // 是否在拖拽中
    private dragging: boolean = false;

    constructor(region: IRegion, type: PointType, name: string) {

        super();
        this.region = region;
        this.type = type;
        this.name = name;
    }

    // 坐标轴的名称
    public getPointName(): string {
        return this.name;
    }

    // 获取接点类型
    public getPointType(): PointType {
        return this.type;
    }

    // 获取所属坐标轴
    public getAxis(type: AxisType): Axis {
        return this.region.getAxis(type);
    }

    // 获取所属区域
    public getRegion(): IRegion {
        return this.region;
    }

    // 获取Offset
    public getOffset(): IOffset {
        return this.offset;
    }

    // 获取端点的当前值
    public getPointValue(): IOffset {
        return this.region.getPointValue(this.name);
    }

    // 向上更的值
    public setPointValue(value: IOffset, virtual?: boolean): void {
        this.region.setPointValue(this.name, value, virtual);
    }

    // 获取拖拽状态
    public getDragging(): boolean {
        return this.dragging;
    }

    // 设置拖拽中状态
    public setDragging(dragging: boolean): void {
        this.dragging = dragging;
        this.region.setDragging(dragging);
    }

    // 刷新端点组件
    public repaint(): void {
        this.emit('repaint');
    }

    // 更新端点的大小
    public updatePointValue(): void {

        const {x, y} = this.getPointValue();

        this.offset = {
            x: this.getAxis(AxisType.HORIZONTAL).getValueOffset(x) || 0,
            y: this.getAxis(AxisType.VERTICAL).getValueOffset(y) || 0
        };

        this.repaint();
    }

    public updateRealOffset(start: IOffset, end: IOffset): void {

        this.offset = this.calcNewOffsetByType(start, end);
        const virtual = this.dragging;
        const value = this.getOffsetPrecisionValue();
        const old = {
            x: this.getPrecisionValue(AxisType.HORIZONTAL),
            y: this.getPrecisionValue(AxisType.VERTICAL)
        };

        const xChangeAndValid = value.x !== old.x && this.getAxis(AxisType.HORIZONTAL).isValidValue(+value.x);
        const yChangeAndValid = value.y !== old.y && this.getAxis(AxisType.VERTICAL).isValidValue(+value.y);

        if (xChangeAndValid || yChangeAndValid) {
            this.setPointValue({
                x: xChangeAndValid ? +value.x : +old.x,
                y: yChangeAndValid ? +value.y : +old.y
            }, virtual);
        } else if (!virtual) {

            // 刷新一下值
            this.setPointValue({
                x: +old.x,
                y: +old.y
            });
        }

        this.region.repaint();
    }

    /**
     * 获取精度计算后的结果
     */
    public getOffsetPrecisionValue(): IPrecisionOffset {

        const {x, y} = this.offset;

        return {
            x: this.getAxis(AxisType.HORIZONTAL).getOffsetPrecisionValue(x),
            y: this.getAxis(AxisType.VERTICAL).getOffsetPrecisionValue(y)
        };
    }

    /**
     * 获取精度计算后的结果
     */
    public getPrecisionValue(type: AxisType): string {

        const {x, y} = this.getPointValue();
        const value = type === AxisType.HORIZONTAL ? x : y;

        return this.getAxis(type).formatPrecisionValue(value);
    }

    public setPrecisionValue(type: AxisType, value: string, virtual?: boolean): boolean {

        const val = +value;
        const axis = this.getAxis(type);
        const {x, y} = this.getPointValue();

        if (!axis.isValidValue(val)) {
            return false;
        }

        this.setPointValue({
            x: type === AxisType.HORIZONTAL ? val : x,
            y: type === AxisType.VERTICAL ? val : y
        }, virtual);

        return true;
    }

    public upStep(type: AxisType, stepCount: number = 1): void {

        if (Math.floor(stepCount) !== stepCount) {
            throw new Error(`stepCount should be int, but receive ${stepCount}`);
        }

        const {x, y} = this.getPointValue();
        const axis = this.getAxis(type);
        const pv = axis.stepPrecisionValue(type === AxisType.HORIZONTAL ? x : y, stepCount);

        this.setPrecisionValue(type, pv);
    }

    public downStep(type: AxisType, stepCount: number = 1): void {

        if (Math.floor(stepCount) !== stepCount) {
            throw new Error(`stepCount should be int, but receive ${stepCount}`);
        }
        const {x, y} = this.getPointValue();
        const axis = this.getAxis(type);
        const pv = axis.stepPrecisionValue(type === AxisType.HORIZONTAL ? x : y, -stepCount);

        this.setPrecisionValue(type, pv);
    }

    // 计算运动位置
    private calcNewOffsetByType(start: IOffset, end: IOffset): IOffset {

        const {x, y} = end;

        const offset = {
            x: Math.min(this.getAxis(AxisType.HORIZONTAL).getAxisLength(), Math.max(0, x)),
            y: Math.min(this.getAxis(AxisType.VERTICAL).getAxisLength(), Math.max(0, y))
        };

        const canXChange = this.type & 0b0010;
        const canYChange = this.type & 0b1000;

        return {
            x: canXChange ? offset.x : start.x,
            y: canYChange ? offset.y : start.y
        };
    }
}
