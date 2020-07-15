/**
 * @file SimpleRegion 单一维度（InputNumber、单一的Slider）
 */
import {IOffset} from '@co-hooks/dom';
import {shallowEqual} from '@co-hooks/util';
import {AxisType, PointType} from '../enum';
import {Point} from './Point';
import {IAxisConfig} from './Axis';
import {Region} from './Region';

export interface ISimpleRegionOptions extends IAxisConfig {
    changeOnEnd?: boolean;
    value: number;
}

export class SimpleRegion extends Region<number> {

    private isTrying: boolean = false;

    private changeOnEnd: boolean = false;

    private value: number = 0;

    private tryingValue: number = 0;

    private old: ISimpleRegionOptions | null = null;

    constructor() {
        super();
        this.createPoint('end', PointType.RIGHT);
    }

    public updateOptions(options: ISimpleRegionOptions): void {

        // 增加一个shallowEqual的判断，如果属性不更新没必要update
        if (this.old != null && shallowEqual(this.old, options)) {
            this.old = options;
            return;
        }
        this.old = options;

        const {value, changeOnEnd = false, ...config} = options;

        this.changeOnEnd = changeOnEnd;
        this.value = value;
        this.tryingValue = 0;
        this.isTrying = false;
        this.getAxis(AxisType.HORIZONTAL).updateAxisConfig(config);
        this.getPoint('end').updatePointValue();
        this.repaint();
    }

    public setPointValue(part: string, value: IOffset, virtual?: boolean): void {

        if (part !== 'end') {
            throw new Error('simple region has only one valid part end');
        }


        if (this.changeOnEnd && virtual) {
            this.tryingValue = value.x;
            this.getPoint('end').repaint();
            return;
        }

        this.emit('change', value.x);
    }

    public getPointValue(part: string): IOffset {

        if (part !== 'end') {
            throw new Error('simple region has only one valid part end');
        }

        return {
            x: this.isTrying ? this.tryingValue : this.value,
            y: 0
        };
    }

    public isValueSelected(value: IOffset): boolean {
        return this.isAxisSelected(AxisType.HORIZONTAL, value.x);
    }

    public isAxisSelected(type: AxisType, value: number): boolean {

        if (type === AxisType.HORIZONTAL) {
            const end = this.isTrying ? this.tryingValue : this.value;
            return value <= end;
        }

        return false;
    }

    public getPointByOffset(): Point {
        return this.getPoint('end');
    }

    public getSelectedRegion(): [IOffset, IOffset] {

        return [
            {x: 0, y: 0},
            {x: this.isTrying ? this.tryingValue : this.value, y: 0}
        ];
    }

    public getSelectedOffset(): [IOffset, IOffset] {
        return [
            {x: 0, y: 0},
            {x: this.getPoint('end').getOffset().x, y: 0}
        ];
    }
}
