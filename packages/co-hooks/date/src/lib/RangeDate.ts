/**
 * @file RangeDate
 */
import {sortDate} from '@co-hooks/util';
import {RangeState, SelectedRangeState} from '../util';
import {BaseDate, IBaseDateEvent, IBaseDateOptions, ISetPanelDateEventParams} from './BaseDate';
import {PanelType} from './BasePanel';

export interface IRangeDateInstance {
    value: Date[];
    innerValue: Date[];
    trying: boolean;
    tryingDate: Date[];
}

export interface IRangeDateEvent extends IBaseDateEvent {
    'value-change': [Date[]];
    'add-start-value': [Date];
}

export type RangePanelUpdater = (range: RangeDate, value: Date[]) => void;

export type SetPanelDate = (root: RangeDate, params: ISetPanelDateEventParams) => void;

export type AddStartValue = (root: RangeDate, date: Date) => void;

export class RangeDate extends BaseDate<IRangeDateEvent> {

    private value: Date[] = [];

    private innerValue: Date[] = [];

    private trying: boolean = false;

    private tryingDate: Date[] = [];

    private tryingValid: boolean = true;

    private presetTrying: boolean = false;

    private presetTryingDate: Date[] = [];

    private presetTryingValid: boolean = true;

    private offset: number = 0;

    private onUpdatePanelDate?: RangePanelUpdater;

    public setRangePanelUpdate(updater: RangePanelUpdater): void {
        this.onUpdatePanelDate = updater;
    }

    public updateValue(value?: Date[]): void {

        if (this.equalValue(this.value, value || [])) {

            // 处理初始化就为[]的问题，导致panel初始date不符合预期
            if ((!value || !value.length) && !this.trying) {
                this.onUpdatePanelDate && this.onUpdatePanelDate(this, []);
            }

            return;
        }

        const old = this.value;
        this.value = sortDate(value || []);
        this.isValueValid = this.getIsValueValid(this.value);

        if (!this.equalValue(old, this.value)) {
            this.onUpdatePanelDate && this.onUpdatePanelDate(this, this.value);
        } else {
            this.repaintPanel();
        }
    }

    public updateOptions(options: IBaseDateOptions & {offset?: number}): void {

        super.updateOptions(options);

        const {offset} = options;

        if (offset != null) {
            this.offset = offset;
        }
    }

    public getValue(): Date[] {
        return this.value;
    }

    public getTryingSelectedState(date: Date): SelectedRangeState {

        if (this.offset !== 0 && this.trying) {
            return this.calcSelectedState(date, this.tryingDate);
        }

        return RangeState.NONE;
    }

    public getSelectedState(date: Date): SelectedRangeState {

        if (this.offset === 0) {
            return this.calcSelectedState(date, this.trying
                ? this.tryingDate
                : this.presetTrying
                    ? this.presetTryingDate
                    : this.value
            );
        }

        return this.calcSelectedState(date, this.presetTrying ? this.presetTryingDate : this.value);
    }

    public isDateSelected(date: Date): boolean {
        const range = this.presetTrying ? this.presetTryingDate : this.value;
        return this.calcSelectedState(date, range, PanelType.DATE) !== RangeState.NONE;
    }

    public isMonthSelected(date: Date): boolean {
        const range = this.presetTrying ? this.presetTryingDate : this.value;
        return this.calcSelectedState(date, range, PanelType.MONTH) !== RangeState.NONE;
    }

    public isWeekSelected(date: Date): boolean {
        const range = this.presetTrying ? this.presetTryingDate : this.value;
        return this.calcSelectedState(date, range, PanelType.WEEK) !== RangeState.NONE;
    }

    public isYearSelected(date: Date): boolean {
        const range = this.presetTrying ? this.presetTryingDate : this.value;
        return this.calcSelectedState(date, range, PanelType.YEAR) !== RangeState.NONE;
    }

    public setPanelSelected(date: Date, part?: string, virtual: boolean = false): void {

        const disabled = this.isDisabled(date);

        if (disabled && !virtual) {
            return;
        }

        if (!this.offset) {
            this.setControlledPanelSelected(date, virtual);
        } else {
            this.setOffsetPanelSelected(date, virtual);
        }
    }

    public revertPanelSelected(): void {
        this.innerValue = [];
    }

    public resetTryingState(): void {
        this.trying = false;
        this.tryingDate = [];
        this.tryingValid = true;
    }

    public setPresetTrying(presetTrying: Date[]): void {
        this.presetTrying = true;
        this.presetTryingDate = presetTrying;
        this.presetTryingValid = this.getIsValueValid(presetTrying);
        this.repaintPanel();
    }

    public resetPresetTrying(): void {
        this.presetTrying = false;
        this.presetTryingDate = [];
        this.presetTryingValid = true;
        this.repaintPanel();
    }

    public isTrying(): boolean {
        return this.trying;
    }

    public getInstance(): IRangeDateInstance {
        return {
            value: this.value,
            innerValue: this.innerValue,
            trying: this.trying,
            tryingDate: this.tryingDate
        };
    }

    public isInvalidTryingDate(): boolean {

        if (this.trying && this.tryingDate.length === 2) {
            return !this.tryingValid;
        }

        return false;
    }

    private equalValue(sourceValue: Date[], compareValue: Date[]): boolean {

        if (sourceValue.length !== compareValue.length) {
            return false;
        }

        const source = sortDate(sourceValue);
        const compare = sortDate(compareValue);

        return !source.some((item, i) => !this.equalDate(item, compare[i]));
    }

    private getIsValueValid(value: Date[]): boolean {

        if (!value.length) {
            return true;
        }

        const [start, end] = sortDate(value);

        let date = start;
        const needRangeValid = this.needRangeValid;

        while (date.getTime() <= end.getTime()) {

            const disabled = this.isDisabled(date);

            if (needRangeValid && disabled) {
                return false;
            }

            if (!needRangeValid && !disabled) {
                return true;
            }

            date = this.nextDate(date);
        }

        return needRangeValid;
    }

    private setTryingState(date: Date): void {
        this.trying = true;
        this.tryingDate = sortDate([...this.innerValue, date]);
        this.tryingValid = this.getIsValueValid(this.tryingDate);
        this.repaintPanel();
    }

    private setControlledPanelSelected(date: Date, virtual: boolean = false): void {

        if (virtual) {

            // 没有起始点，不做trying操作
            if (!this.innerValue.length) {
                return;
            }

            this.setTryingState(date);
            return;
        }

        this.innerValue.push(date);

        if (this.innerValue.length < 2) {
            this.setTryingState(date);
            this.emit('add-start-value', date);
            return;
        }

        this.innerValue = sortDate(this.innerValue);

        const valid = this.getIsValueValid(this.innerValue);

        if (valid) {
            this.resetTryingState();
            this.emit('value-change', this.innerValue);
            this.revertPanelSelected();

            return;
        }

        // 结束值，提交不合法，当做trying上线
        this.innerValue.pop();
        this.setTryingState(date);
    }

    private calcSelectedState(date: Date, value: Date[], type?: PanelType): SelectedRangeState {

        if (value.length < 2) {
            return RangeState.NONE;
        }

        const [start, end] = value;

        if (this.lessThanDate(date, start, type) || this.greaterThanDate(date, end, type)) {
            return RangeState.NONE;
        }

        if (this.equalDate(date, end, type) && this.equalDate(date, start, type)) {
            return RangeState.SINGLE;
        }

        if (this.equalDate(start, date, type)) {
            return RangeState.START;
        }

        if (this.equalDate(end, date, type)) {
            return RangeState.END;
        }

        return RangeState.IN;
    }

    private setOffsetPanelSelected(date: Date, virtual: boolean = false): void {

        if (!this.offset) {
            return;
        }

        const endDate = this.offset > 0
            ? this.nextDate(date, Math.abs(this.offset) - 1)
            : this.prevDate(date, Math.abs(this.offset) - 1);

        const value = sortDate([date, endDate]);
        const valid = this.getIsValueValid(value);

        if (virtual || !valid) {
            this.trying = true;
            this.tryingDate = value;
            this.tryingValid = valid;
            this.repaintPanel();
            return;
        }

        this.resetTryingState();
        this.emit('value-change', value);
    }
}
