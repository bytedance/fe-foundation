/**
 * @file SimpleRegion 单一维度（InputNumber、单一的Slider）
 */
import {IOffset} from '@co-hooks/dom';
import {AxisType, PointType} from '../enum';
import {Point} from './Point';
import {IAxisConfig} from './Axis';
import {Region} from './Region';

export interface IRangeRegionOptions extends IAxisConfig {
    changeOnEnd?: boolean;
    value: number[];
}

export class RangeRegion extends Region<number[]> {

    private isTrying: boolean = false;

    private changeOnEnd: boolean = false;

    private startValue: number = 0;

    private endValue: number = 0;

    private tryingStartValue: number = 0;

    private tryingEndValue: number = 0;

    constructor() {
        super();
        this.createPoint('start', PointType.RIGHT);
        this.createPoint('end', PointType.RIGHT);
    }

    public updateOptions(options: IRangeRegionOptions): void {

        const {value, changeOnEnd = false, ...config} = options;
        const sd = this.getPoint('start').getDragging();
        const ed = this.getPoint('end').getDragging();
        const swap = ed && value[0] !== this.startValue && value[1] === this.startValue
            || sd && value[1] !== this.endValue && value[0] === this.endValue;

        this.changeOnEnd = changeOnEnd;
        this.startValue = value[swap ? 1 : 0] || 0;
        this.endValue = value[swap ? 0 : 1] || 0;

        // 如果不在拖拽中，就换过来
        if (!this.getDragging()) {
            this.tryingStartValue = 0;
            this.tryingEndValue = 0;
            this.isTrying = false;
        }

        this.getAxis(AxisType.HORIZONTAL).updateAxisConfig(config);
        this.getPoint('start').updatePointValue();
        this.getPoint('end').updatePointValue();
        this.repaint();
    }

    public setPointValue(part: string, value: IOffset, virtual?: boolean): void {

        if (part !== 'end' && part !== 'start') {
            throw new Error('range region has two valid part start/end');
        }

        if (this.changeOnEnd && virtual) {
            this[part === 'start' ? 'tryingStartValue' : 'tryingEndValue'] = value.x;
            this.getPoint('start').repaint();
            this.getPoint('end').repaint();
            return;
        }

        const start = part === 'start' ? value.x : this.startValue;
        const end = part === 'end' ? value.x : this.endValue;

        this.emit('change', [Math.min(start, end), Math.max(start, end)]);
    }

    public getPointValue(part: string): IOffset {

        if (part !== 'end' && part !== 'start') {
            throw new Error('range region has two valid part start/end');
        }

        if (part === 'end') {
            return {
                x: this.isTrying ? this.tryingEndValue : this.endValue,
                y: 0
            };
        }

        return {
            x: this.isTrying ? this.tryingStartValue : this.startValue,
            y: 0
        };
    }

    public isValueSelected(value: IOffset): boolean {
        return this.isAxisSelected(AxisType.HORIZONTAL, value.x);
    }

    public isAxisSelected(type: AxisType, value: number): boolean {

        if (type === AxisType.HORIZONTAL) {
            const [start, end] = this.getSelectedRegion();
            return value <= end.x && value >= start.x;
        }

        return false;
    }

    public getPointByOffset(offset: IOffset): Point {

        const deltaS = Math.abs(this.getPoint('start').getOffset().x - offset.x);
        const deltaE = Math.abs(this.getPoint('end').getOffset().x - offset.x);
        return deltaE <= deltaS ? this.getPoint('end') : this.getPoint('start');
    }

    public getSelectedRegion(): [IOffset, IOffset] {

        const start = this.isTrying ? this.tryingStartValue : this.startValue;
        const end = this.isTrying ? this.tryingEndValue : this.endValue;

        return [
            {x: Math.min(start, end), y: 0},
            {x: Math.max(start, end), y: 0}
        ];
    }

    public getSelectedOffset(): [IOffset, IOffset] {

        const start = this.getPoint('start').getOffset().x;
        const end = this.getPoint('end').getOffset().x;

        return [
            {x: Math.min(start, end), y: 0},
            {x: Math.max(start, end), y: 0}
        ];
    }
}
