/**
 * @file SimpleDate
 */
import {RangeState, SelectedRangeState} from '../util';
import {BaseDate, IBaseDateEvent} from './BaseDate';
import {PanelType} from './BasePanel';

export interface ISimpleDateEvent extends IBaseDateEvent {
    'value-change': [Date];
}

export type SimplePanelUpdater = (range: SimpleDate, value: Date | null) => void;

export class SimpleDate extends BaseDate<ISimpleDateEvent> {

    // 内置value
    private value: Date | null = null;

    private onUpdatePanelDate?: SimplePanelUpdater;

    private presetTrying: boolean = false;

    private presetTryingDate: Date | null = null;

    private presetTryingValid: boolean = true;

    public setPresetTrying(presetTrying: Date): void {
        this.presetTrying = true;
        this.presetTryingDate = presetTrying;
        this.presetTryingValid = this.isDisabled(presetTrying);
    }

    public resetPresetTrying(): void {
        this.presetTrying = false;
        this.presetTryingDate = null;
        this.presetTryingValid = true;
    }

    public setSimplePanelUpdate(updater: SimplePanelUpdater): void {
        this.onUpdatePanelDate = updater;
    }

    public updateValue(value?: Date): void {

        // 当前没有选中状态，或者外界的值发生变化，则直接赋值
        if (this.value == null || !this.equalDate(value, this.value)) {

            const old = this.value;
            this.value = value || null;

            // 不相同才需要更新
            if (!this.equalDate(old, this.value)) {
                this.onUpdatePanelDate && this.onUpdatePanelDate(this, this.value);
            }

            this.isValueValid = !this.value || !this.isDateDisabled(this.value);
        }
    }

    public getSelectedState(date: Date): SelectedRangeState {

        if (!this.isSelected(date)) {
            return RangeState.NONE;
        }

        return RangeState.SINGLE;
    }

    public isDateSelected(date: Date): boolean {


        if (this.presetTrying) {

            if (!this.presetTryingDate) {
                return false;
            }

            return this.equalDate(this.presetTryingDate, date, PanelType.DATE);
        }

        if (!this.value) {
            return false;
        }

        return this.equalDate(this.value, date, PanelType.DATE);
    }

    public isMonthSelected(date: Date): boolean {

        if (this.presetTrying) {

            if (!this.presetTryingDate) {
                return false;
            }

            return this.equalDate(this.presetTryingDate, date, PanelType.MONTH);
        }

        if (!this.value) {
            return false;
        }

        return this.equalDate(this.value, date, PanelType.MONTH);
    }

    public isWeekSelected(date: Date): boolean {

        if (this.presetTrying) {

            if (!this.presetTryingDate) {
                return false;
            }

            return this.equalDate(this.presetTryingDate, date, PanelType.WEEK);
        }

        if (!this.value) {
            return false;
        }

        return this.equalDate(this.value, date, PanelType.WEEK);
    }

    public isYearSelected(date: Date): boolean {

        if (this.presetTrying) {

            if (!this.presetTryingDate) {
                return false;
            }

            return this.equalDate(this.presetTryingDate, date, PanelType.YEAR);
        }

        if (!this.value) {
            return false;
        }

        return this.equalDate(this.value, date, PanelType.YEAR);
    }

    public setPanelSelected(date: Date, part: string, virtual: boolean = false): void {

        // 单选不做virtual判断
        if (virtual) {
            return;
        }

        const disabled = this.isDisabled(date);

        // 先取值再判断
        if (disabled) {
            return;
        }

        this.emit('value-change', date);
    }

    public getValue(): Date | null {
        return this.value;
    }
}
