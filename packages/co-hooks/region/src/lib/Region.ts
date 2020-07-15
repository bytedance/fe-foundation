/**
 * @file Region 区域
 */
import {IElementSize, IOffset, getDefaultElementSize} from '@co-hooks/dom';
import {Emitter} from '@co-hooks/emitter';
import {AxisType, PointType} from '../enum';
import {Axis} from './Axis';
import {Point} from './Point';

export interface IRegion {

    // 刷新一下元素
    repaint(): void;

    // 获取端点
    getPoint(key: string): Point;

    // 获取坐标轴
    getAxis(type: AxisType): Axis;

    // virtual为true时，表示在输入中或者拖拽中，父类可以选择是否向上抛出中间状态
    setPointValue(part: string, value: IOffset, virtual?: boolean): void;

    // 获取维度的值
    getPointValue(part: string): IOffset;

    // 获取区间长度
    getAxisLength(type: AxisType): number;

    // 设置区域的大小
    updateRegionSize(size: IElementSize): void;

    // 值是否被选中
    isValueSelected(value: IOffset): boolean;

    // 坐标轴是否选中
    isAxisSelected(type: AxisType, value: number): boolean;

    // 拖拽中
    getDragging(): boolean;

    // 设置拖拽状态
    setDragging(dragging: boolean): void;

    // 根据Offset获取Point
    getPointByOffset(offset: IOffset): Point;

    // 获取一个从起点到终点的选中区域
    getSelectedRegion(): [IOffset, IOffset];

    // 获取当前运行中的选中区域
    getSelectedOffset(): [IOffset, IOffset];
}

export interface IRegionEvent<T> {
    'change': [T];
    'repaint': [];
}

export abstract class Region<T> extends Emitter<IRegionEvent<T>> implements IRegion {

    private readonly axisMap: {[key: string]: Axis} = {};

    private readonly pointMap: {[key: string]: Point} = {};

    private size: IElementSize = getDefaultElementSize();

    private dragging: boolean = false;

    protected constructor() {

        super();

        this.createAxis(AxisType.HORIZONTAL);
        this.createAxis(AxisType.VERTICAL);
    }

    public repaint(): void {
        this.emit('repaint');
    }

    // 获取数据点
    public getPoint(part: string): Point {

        if (!this.pointMap[part]) {
            throw new Error(`Point ${part} is not found`);
        }

        return this.pointMap[part];
    }

    // 获取坐标轴
    public getAxis(type: AxisType): Axis {

        if (!this.axisMap[type]) {
            throw new Error(`Axis ${type} is not found`);
        }

        return this.axisMap[type];
    }

    // 获取坐标轴长度
    public getAxisLength(type: AxisType): number {
        return type === AxisType.HORIZONTAL ? this.size.width : this.size.height;
    }

    public updateRegionSize(size: IElementSize): void {

        const old = this.size;
        this.size = size;
        let xChanged = false;
        let yChanged = false;

        if (this.axisMap[AxisType.HORIZONTAL] && old.width !== size.width) {
            this.getAxis(AxisType.HORIZONTAL).repaint();
            xChanged = true;
        }

        if (this.axisMap[AxisType.VERTICAL] && old.height !== size.height) {
            this.getAxis(AxisType.VERTICAL).repaint();
            yChanged = true;
        }

        if (xChanged || yChanged) {
            this.repaintPoint();
        }

        this.repaint();
    }

    public getDragging(): boolean {
        return this.dragging;
    }

    public setDragging(dragging: boolean): void {
        if (this.dragging !== dragging) {

            this.dragging = dragging;

            if (!dragging) {
                this.repaintPoint();
            }
        }
    }

    protected createAxis(type: AxisType): Axis {

        if (this.axisMap[type]) {
            throw new Error(`Axis ${type} has already exist`);
        }

        return this.axisMap[type] = new Axis(this, type);
    }

    protected createPoint(part: string, type: PointType): Point {

        if (this.pointMap[part]) {
            throw new Error(`Point ${part} has already exist`);
        }

        return this.pointMap[part] = new Point(this, type, part);
    }

    // 刷新坐标轴对应的点
    protected repaintPoint(): void {
        Object.keys(this.pointMap).forEach(key => this.getPoint(key).updatePointValue());
    }

    public abstract setPointValue(part: string, value: IOffset, virtual?: boolean): void;

    public abstract getPointValue(part: string): IOffset;

    public abstract isValueSelected(value: IOffset): boolean;

    public abstract isAxisSelected(type: AxisType, value: number): boolean;

    public abstract getPointByOffset(offset: IOffset): Point;

    public abstract getSelectedRegion(): [IOffset, IOffset];

    public abstract getSelectedOffset(): [IOffset, IOffset];
}
