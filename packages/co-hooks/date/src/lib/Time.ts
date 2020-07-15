/**
 * @file Time
 */

import {getKeys} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import {RangeTime} from './RangeTime';

export enum TimeType {
    HOUR = 'hour',
    MINUTE = 'minute',
    SECOND = 'second'
}

export interface ITimeItem {
    value: string;
    disabled: boolean;
}

export interface IBaseTimeOptions {
    showHour?: boolean;
    showMinute?: boolean;
    showSecond?: boolean;
    hourStep?: number;
    minuteStep?: number;
    secondStep?: number;
    disabledHours?: (v: number) => boolean;
    disabledMinutes?: (v: number) => boolean;
    disabledSeconds?: (v: number) => boolean;
}

export interface ITimeEvent {
    repaint: [];
    'value-change': [Date];
}

export class Time extends Emitter<ITimeEvent> {
    public part: string;
    public showHour: boolean = true;
    public showMinute: boolean = true;
    public showSecond: boolean = true;
    public hour: number | null = null;
    public minute: number | null = null;
    public second: number | null = null;
    public root: RangeTime | null = null;
    private value: Date | null = null;
    private readonly hourStep: number = 1;
    private readonly minuteStep: number = 1;
    private readonly secondStep: number = 1;

    constructor(part: string) {
        super();
        this.part = part;
    }

    public repaintTime(): void {
        this.emit('repaint');
    }

    public updateOptions(options: IBaseTimeOptions): void {
        getKeys(options).forEach(key => {
            if (options[key] !== undefined) {
                Object.assign(this, {
                    [key]: options[key]
                });
            }
        });
    }

    public updateTime(time?: Date): void {
        if (time == null) {
            this.hour = null;
            this.minute = null;
            this.second = null;
        } else {
            const t1 = time?.getHours() || 0;
            const t2 = time?.getMinutes() || 0;
            const t3 = time?.getSeconds() || 0;

            if (this.showHour) {
                this.hour = +t1;
            }

            if (this.showMinute) {
                this.showHour ? (this.minute = +t2) : (this.minute = +t1);
            }

            if (this.showSecond) {
                if (this.showHour && this.showSecond) {
                    this.second = +t3;
                }

                if (!this.showHour && !this.showSecond) {
                    this.second = +t1;
                }

                if (
                    (this.showHour && !this.showSecond)
                    || (!this.showHour && this.showSecond)
                ) {
                    this.second = +t2;
                }
            }
        }

        this.value = time || null;
        if (this.root) {
            this.root.repaint();
        } else {
            this.repaintTime();
        }
    }

    public getHourOptions(): ITimeItem[] {
        if (!this.showHour) {
            return [];
        }

        return this.generateOptions(
            24,
            this.hourStep,
            this.disabledHours,
            TimeType.HOUR
        );
    }

    public getMinuteOptions(): ITimeItem[] {
        if (!this.showMinute) {
            return [];
        }

        return this.generateOptions(
            60,
            this.minuteStep,
            this.disabledMinutes,
            TimeType.MINUTE
        );
    }

    public getSecondOptions(): ITimeItem[] {
        if (!this.showSecond) {
            return [];
        }

        return this.generateOptions(
            60,
            this.secondStep,
            this.disabledSeconds,
            TimeType.SECOND
        );
    }

    public getCurrentIndex(type: TimeType, options: ITimeItem[]): number {
        let currentValue = -1;
        let activeIndex = -1;

        switch (type) {
            case TimeType.HOUR:
                this.hour !== null && (currentValue = this.hour);
                break;
            case TimeType.MINUTE:
                this.minute !== null && (currentValue = this.minute);
                break;
            case TimeType.SECOND:
                this.second !== null && (currentValue = this.second);
                break;
        }
        options.map((item, index) => {
            if (currentValue === +item.value) {
                activeIndex = index;
            }
        });
        return activeIndex;
    }

    public onSelect(type: TimeType, value: number): void {
        const newValue = this.value || new Date();

        switch (type) {
            case TimeType.HOUR:
                this.hour = value;
                newValue.setHours(value);
                break;
            case TimeType.MINUTE:
                this.minute = value;
                newValue.setMinutes(value);
                break;
            case TimeType.SECOND:
                this.second = value;
                newValue.setSeconds(value);
                break;
        }

        this.value = newValue;
        this.repaintTime();

        if (
            (this.showHour && this.hour == null)
            || (this.showMinute && this.minute == null)
            || (this.showSecond && this.second == null)
        ) {
            return;
        }
        this.value && this.emit('value-change', this.value);
    }

    private generateOptions(
        length: number,
        step: number,
        disabledFunc: (v: number) => boolean,
        type: TimeType
    ): ITimeItem[] {
        const arr = [];

        for (let i = 0; i < length; i += step) {
            arr.push({
                value: this.padLef(i),
                disabled:
                    disabledFunc(i)
                    || (!!this.root && this.root.compare(i, type, this.part))
            });
        }
        return arr;
    }

    private disabledHours(v: number): boolean {
        return false;
    }

    private disabledMinutes(v: number): boolean {
        return false;
    }

    private disabledSeconds(v: number): boolean {
        return false;
    }

    private padLef(v: number): string {
        return v >= 10 ? `${v}` : `0${v}`;
    }
}
