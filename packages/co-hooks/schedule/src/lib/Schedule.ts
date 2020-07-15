/**
 * @file Schedule
 */
import {Emitter} from '@co-hooks/emitter';
import {getKeys} from '@co-hooks/util';
import {ScheduleSelectType, formatTime} from './SchedulePanel';

export interface IScheduleValue {
    label: string;
    value: number[];
}

export interface IScheduleDisplayInfo {
    label: string;
    value: string[];
}

export interface IRcScheduleBaseOptions {
    datasource: string[];
    divider?: number;
    // 间断的
    interrupted?: boolean;
    // 反选
    inverseSelect?: boolean;
    // 是否禁用
    disabled?: boolean;
    isTimeDisabled?: (label: string, index: number) => boolean;
}

export interface IScheduleEvent {
    'value-change': [IScheduleValue[]];
    'datasource-update': [];
    'repaint-panel': [];
}

export class Schedule extends Emitter<IScheduleEvent> {

    private value: IScheduleValue[] = [];

    private datasource: string[] = [];

    private divider: number = 1;

    private interrupted: boolean = true;

    private inverseSelect: boolean = true;

    private disabled: boolean = false;

    private valueHash: { [key: string]: number[] } = {};

    public updateValue(value: IScheduleValue[]): void {
        if (this.value === value || (this.value.length === 0 && value.length === 0)) {
            return;
        }

        this.value = value;
        this.valueHash = {};

        this.value.forEach(val => this.valueHash[val.label] = val.value);

        this.emit('repaint-panel');
    }

    public updateOptions(options: IRcScheduleBaseOptions): void {
        const {
            datasource,
            interrupted = true,
            divider = 1,
            isTimeDisabled,
            inverseSelect = true,
            disabled = false
        } = options;

        this.interrupted = interrupted;
        this.divider = divider;
        this.inverseSelect = inverseSelect;
        this.disabled = disabled;

        if (this.datasource !== datasource) {
            this.emit('datasource-update');
            this.datasource = datasource;
        }

        if (isTimeDisabled != null) {
            this.isTimeDisabled = isTimeDisabled;
        }
    }

    public getDatasource(): string[] {
        return this.datasource;
    }

    public getDivider(): number {
        return this.divider;
    }

    public getInterrupted(): boolean {
        return this.interrupted;
    }

    public getDisabled(): boolean {
        return this.disabled;
    }

    public getItemSelectType(
        label: string,
        index: number
    ): ScheduleSelectType {
        let selected = false;
        let selectType = ScheduleSelectType.NONE;
        const value = this.value;

        value.some(item => {
            if (item.label === label) {
                if (item.value.indexOf(index) >= 0) {
                    selected = true;
                }
                return true;
            }
        });

        if (selected) {
            selectType = ScheduleSelectType.SELECTED;
        }

        return selectType;
    }

    public isTimeDisabled(lable: string, index: number): boolean {
        return false;
    }

    public setValue(addVal: IScheduleValue[]): void {
        let value: IScheduleValue[] = [];
        let flag = true;

        if (this.disabled) {
            return;
        }

        const newValueHash: { [key: string]: number[] } = {};

        addVal.forEach(val => {
            newValueHash[val.label] = val.value;
        });

        this.datasource.some(data => {
            const val = this.valueHash[data] || [];
            const newVal = newValueHash[data] || [];

            let res = ([] as number[]).concat(val, newVal).sort();

            // 有不合法值，跳出
            if (res.some(idx => this.isTimeDisabled(data, idx))) {
                flag = false;
                return true;
            }

            if (this.interrupted) {
                res = this.calcInterrupted(res);
            } else {
                // 不间断时间
                res = this.calcUninterrupted(res, val) || newVal;
            }

            value.push({
                label: data,
                value: res
            });
        });

        if (flag) {
            this.emit('value-change', value);
        } else {
            this.emit('repaint-panel');
        }
    }

    public clearValue(): void {
        // this.resetTrying();
        if (this.disabled) {
            return;
        }
        this.emit('value-change', []);
    }

    public getDisplayInfo(): IScheduleDisplayInfo[] {
        const info: IScheduleDisplayInfo[] = [];
        const colTime = 60 / this.divider;

        this.value.forEach(item => {
            const {label, value} = item;
            const values = this.splitValue(value);
            const formatValues: string[] = [];

            values.forEach(([startIdx, endIdx]) => {
                const st = startIdx * colTime;
                const et = (endIdx + 1) * colTime;

                formatValues.push(`${formatTime(st)}~${formatTime(et)}`);
            });

            info.push({
                label,
                value: formatValues
            });
        });

        return info;
    }

    private splitValue(value: number[]): number[][] {
        const res: number[][] = [];
        const len = value.length;
        let left: number;
        let right: number;

        value.forEach((item, i) => {
            if (left == null || right == null) {
                left = right = item;
            } else {
                if (right + 1 === item) {
                    right = item;
                } else {
                    res.push([left, right]);
                    left = right = item;
                }
            }

            if (i === len - 1) {
                res.push([left, right]);
            }
        });

        return res;
    }

    private calcInterrupted(value: number[]): number[] {
        const hash: { [key: number]: number } = {};
        const inverseSelect = this.inverseSelect;

        value.forEach(val => {
            hash[val] = (hash[val] || 0) + 1;
        });

        return inverseSelect
            ? getKeys(hash).filter(item => hash[item] === 1).map(key => +key)
            : getKeys(hash).map(key => +key);
    }

    private calcUninterrupted(value: number[], originValue: number[]): number[] | false {
        const hash: { [key: number]: number } = {};
        const inverseSelect = this.inverseSelect;

        value.forEach(val => {
            hash[val] = (hash[val] || 0) + 1;
        });

        const newValues: number[] = getKeys(hash).map(key => +key);
        const duplicate = getKeys(hash).some(item => hash[item] > 1);

        // 新value检测出来有多段数据，则直接返回失败
        if (this.splitValue(newValues).length > 1) {
            return false;
        }

        // 认为选择了原有范围内的时间
        if (duplicate && newValues.length === originValue.length) {
            return inverseSelect ? [] : newValues;
        }

        // 新增了选取范围，不做反选
        return newValues;
    }
}
