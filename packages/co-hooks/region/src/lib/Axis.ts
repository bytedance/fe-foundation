/**
 * @file Axis 单一数字坐标轴
 */

import {Emitter} from '@co-hooks/emitter';
import {AxisType} from '../enum';
import {IRegion} from './Region';

export interface IAxisConfig {
    strict?: boolean;
    step?: number;
    min?: number;
    max?: number;
    precision?: number;
}

export interface IAxisEvents {
    'repaint': [];
}

export class Axis extends Emitter<IAxisEvents> {

    /**
     * 获取值的精度
     * @param value 值
     */
    private static getPrecision(value: string | number): number {

        const valueString = value.toString();

        if (valueString.indexOf('e-') >= 0) {
            return parseInt(valueString.slice(valueString.indexOf('e-') + 2), 10);
        }

        let precision = 0;

        if (valueString.indexOf('.') >= 0) {
            precision = valueString.length - valueString.indexOf('.') - 1;
        }

        return precision;
    }

    // 步长
    private step: number = 1;

    // 精度
    private precision?: number;

    // 区间下限
    private min: number = 0;

    // 区间上线
    private max: number = 0;

    // 是否严格模式
    private strict: boolean = false;

    // 坐标轴类型
    private readonly type: AxisType;

    // 所属坐标区域
    private readonly region: IRegion;

    constructor(region: IRegion, type: AxisType) {

        super();
        this.type = type;
        this.region = region;
    }

    // 坐标轴的类型
    public getAxisType(): AxisType {
        return this.type;
    }

    // 获取所属区域
    public getRegion(): IRegion {
        return this.region;
    }

    // 获取坐标轴长度
    public getAxisLength(): number {
        return this.region.getAxisLength(this.type);
    }

    // 根据数值，获取数值对应的Offset
    public getValueOffset(value: number): number {
        return Math.floor((value - this.min) / (this.max - this.min) * this.getAxisLength());
    }

    // 获取实例属性，方便展示和调试
    public getAxisConfig(): Required<IAxisConfig> {

        return {
            strict: this.strict,
            max: this.max,
            min: this.min,
            step: this.step,
            precision: this.getMaxPrecision()
        };
    }

    // 更新实例属性
    public updateAxisConfig(config: IAxisConfig): void {

        const {
            strict = false,
            step = 1,
            precision,
            min,
            max
        } = config;

        this.step = step;
        this.precision = precision;
        this.strict = strict;

        if (config.strict) {

            if (min == null || max == null) {
                throw new Error('props `min` and `max` are required in strict mode');
            }

            this.min = min;
            this.max = max;

            if (!this.isValidValue(max)) {
                throw new Error(
                    `max is invalid:  max = ${max} doesn't match formula \`min + step * n, n is integer\``
                );
            }

        } else {
            this.min = min == null ? Number.MIN_SAFE_INTEGER : min;
            this.max = max == null ? Number.MAX_SAFE_INTEGER : max;
        }

        this.repaint();
    }

    // 刷新坐标轴组件
    public repaint(): void {
        this.emit('repaint');
    }

    // 格式化数值字符串
    public formatPrecisionValue(val: number, precisionValue?: string | number): string {

        const precision = this.getMaxPrecision(precisionValue);

        if (!isNaN(precision)) {
            return val.toFixed(precision);
        }

        return String(val);
    }

    public getOffsetPrecisionValue(offset: number): string {
        const {max, min} = this;

        if (this.getAxisLength() === 0) {
            return this.formatPrecisionValue(this.getValidValue(0));
        }

        return this.formatPrecisionValue(this.getValidValue(
            offset / this.getAxisLength() * (max - min) + min
        ));
    }

    // 判断当前字符串值是否合法
    public isValidPrecisionValue(value: string): boolean {
        return this.isValidValue(+value);
    }

    // 判断value是否符合当前值
    public isValidValue(value: number): boolean {

        const {strict, min, max, step} = this;

        if (isNaN(value)) {
            return false;
        }

        if (min != null && value < min || max != null && value > max) {
            return false;
        }

        if (strict) {
            // 合法值应该满足  min + step * n(n是整数)
            return (value - min) % step === 0;
        }

        return true;
    }

    // 获取最大精度
    public getMaxPrecision(value?: number | string): number {

        if (this.precision != null) {
            return this.precision;
        }

        const minPrecision = Axis.getPrecision(this.min);
        const maxPrecision = Axis.getPrecision(this.max);
        const stepPrecision = Axis.getPrecision(this.step);
        const currentValuePrecision = value == null ? 0 : Axis.getPrecision(value);

        return Math.max(currentValuePrecision, stepPrecision, minPrecision, maxPrecision);
    }

    public isValueSelected(value: number): boolean {
        return this.region.isAxisSelected(this.type, value);
    }

    public isAxisSelected(value: number): boolean {
        return this.region.isAxisSelected(this.type, value);
    }

    // 获取一个值的区间合法值
    public getValidValue(value: number): number {

        let val = value;

        if (isNaN(val)) {
            throw new Error(`${val} is not a valid number`);
        }

        // 如果有strict，就寻找一个合适的值
        if (this.strict) {
            const count = Math.round((val - this.min) / this.step);
            val = count * this.step + this.min;
        }

        if (this.min != null && val < this.min) {
            val = this.min;
        }

        if (this.max != null && val > this.max) {
            val = this.max;
        }

        return val;
    }

    public stepPrecisionValue(value: number | string, stepCount: number = 1): string {
        return this.formatPrecisionValue(
            this.getValidValue(Number(value) + stepCount * this.step),
            value
        );
    }
}
