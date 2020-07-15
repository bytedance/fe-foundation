/**
 * @file SimpleRegion 单一维度（InputNumber、单一的Slider）
 */
import {IOffset, getDefaultOffset} from '@co-hooks/dom';
import {AxisType, PointType} from '../enum';
import {IAxisConfig} from './Axis';
import {Point} from './Point';
import {Region} from './Region';

export interface ITwoDimensionRegionOptions {
    changeOnEnd?: boolean;
    value: IOffset;
    xAxis: IAxisConfig;
    yAxis: IAxisConfig;
}

export class TwoDimensionRegion extends Region<IOffset> {

    private isTrying: boolean = false;

    private changeOnEnd: boolean = false;

    private value: IOffset = getDefaultOffset();

    private tryingValue: IOffset = getDefaultOffset();

    constructor() {
        super();
        this.createPoint('end', PointType.RIGHT_BOTTOM);
    }

    public updateOptions(options: ITwoDimensionRegionOptions): void {

        const {value, changeOnEnd = false, xAxis, yAxis} = options;

        this.changeOnEnd = changeOnEnd;
        this.value = value;
        this.tryingValue = getDefaultOffset();
        this.isTrying = false;
        this.getAxis(AxisType.HORIZONTAL).updateAxisConfig(xAxis);
        this.getAxis(AxisType.VERTICAL).updateAxisConfig(yAxis);
        this.getPoint('end').updatePointValue();
        this.repaint();
    }

    public setPointValue(part: string, value: IOffset, virtual?: boolean): void {

        if (part !== 'end') {
            throw new Error('simple region has only one valid part end');
        }


        if (this.changeOnEnd && virtual) {
            this.tryingValue = value;
            this.getPoint('end').repaint();
            return;
        }

        this.emit('change', value);
    }

    public getPointValue(part: string): IOffset {

        if (part !== 'end') {
            throw new Error('simple region has only one valid part end');
        }

        return this.isTrying ? this.tryingValue : this.value;
    }

    public isValueSelected(value: IOffset): boolean {
        return this.isAxisSelected(AxisType.HORIZONTAL, value.x)
            && this.isAxisSelected(AxisType.VERTICAL, value.y);
    }

    public isAxisSelected(type: AxisType, value: number): boolean {

        const end = this.isTrying ? this.tryingValue : this.value;

        if (type === AxisType.HORIZONTAL) {
            return value <= end.x;
        }

        if (type === AxisType.VERTICAL) {
            return value <= end.y;
        }

        return false;
    }

    public getPointByOffset(): Point {
        return this.getPoint('end');
    }

    public getSelectedRegion(): [IOffset, IOffset] {

        return [
            {x: 0, y: 0},
            this.isTrying ? this.tryingValue : this.value
        ];
    }

    public getSelectedOffset(): [IOffset, IOffset] {
        return [
            {x: 0, y: 0},
            this.getPoint('end').getOffset()
        ];
    }
}
