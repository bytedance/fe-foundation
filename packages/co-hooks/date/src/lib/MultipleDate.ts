/**
 * @file MultipleDate
 */
import {sortDate} from '@co-hooks/util';
import {RangeState, SelectedRangeState} from '../util';
import {BaseDate, FrameSelectedType, IBaseDateEvent, ISetPanelDateEventParams} from './BaseDate';
import {PanelType} from './BasePanel';

export interface IMultipleDateEvent extends IBaseDateEvent {
    'value-change': [Date[]];
}

export type MultiplePanelUpdater = (range: MultipleDate, value: Date[]) => void;

export type SetMultiplePanelDate = (root: MultipleDate, params: ISetPanelDateEventParams) => void;

export class MultipleDate extends BaseDate<IMultipleDateEvent> {

    private value: Date[] = [];

    private onUpdatePanelDate?: MultiplePanelUpdater;

    private trying: boolean = false;

    private tryingDate: Date[] = [];

    private tryingValid: boolean = true;

    private presetTrying: boolean = false;

    private presetTryingDate: Date[] = [];

    private presetTryingValid: boolean = true;

    public setMultiplePanelUpdate(updater: MultiplePanelUpdater): void {
        this.onUpdatePanelDate = updater;
    }

    public updateValue(value?: Date[]): void {

        if (this.equalValue(this.value, value || [])) {
            return;
        }

        const old = this.value;
        this.value = value || [];
        this.isValueValid = !(this.value.some(item => this.isDisabled(item)));

        if (!this.equalValue(old, this.value)) {
            this.onUpdatePanelDate && this.onUpdatePanelDate(this, this.value);
        } else {
            this.repaintPanel();
        }
    }


    public getValue(): Date[] {
        return this.value;
    }

    public getTryingSelectedState(date: Date): SelectedRangeState {

        if (this.isSelected(date)) {
            return RangeState.SINGLE;
        }

        return RangeState.NONE;
    }

    public getSelectedState(date: Date): SelectedRangeState {

        if (this.isSelected(date)) {
            return RangeState.SINGLE;
        }

        return RangeState.NONE;
    }

    public isDateSelected(date: Date): boolean {

        if (this.presetTrying) {
            return this.presetTryingDate.some(item => this.equalDate(item, date, PanelType.DATE));
        }

        if (this.trying) {
            return this.tryingDate.some(item => this.equalDate(item, date, PanelType.DATE));
        }

        return this.value.some(item => this.equalDate(item, date, PanelType.DATE));
    }

    public isMonthSelected(date: Date): boolean {

        if (this.presetTrying) {
            return this.presetTryingDate.some(item => this.equalDate(item, date, PanelType.MONTH));
        }

        if (this.trying) {
            return this.tryingDate.some(item => this.equalDate(item, date, PanelType.MONTH));
        }

        return this.value.some(item => this.equalDate(item, date, PanelType.MONTH));
    }

    public isWeekSelected(date: Date): boolean {

        if (this.presetTrying) {
            return this.presetTryingDate.some(item => this.equalDate(item, date, PanelType.WEEK));
        }

        if (this.trying) {
            return this.tryingDate.some(item => this.equalDate(item, date, PanelType.WEEK));
        }

        return this.value.some(item => this.equalDate(item, date, PanelType.WEEK));
    }

    public isYearSelected(date: Date): boolean {

        if (this.presetTrying) {
            return this.presetTryingDate.some(item => this.equalDate(item, date, PanelType.YEAR));
        }

        if (this.trying) {
            return this.tryingDate.some(item => this.equalDate(item, date, PanelType.YEAR));
        }

        return this.value.some(item => this.equalDate(item, date, PanelType.YEAR));
    }

    public setPanelSelected(date: Date, part: string, virtual: boolean = false): void {

        const disabled = this.isDisabled(date);

        if (disabled || virtual) {
            return;
        }

        const value = this.value.slice(0);

        for (let i = 0; i < value.length; i++) {

            const item = value[i];

            if (this.equalDate(item, date)) {
                value.splice(i, 1);
                this.resetTryingState();
                this.emit('value-change', value);
                return;
            }
        }

        value.push(date);
        this.resetTryingState();
        this.emit('value-change', value);
    }


    public resetTryingState(): void {
        this.trying = false;
        this.tryingDate = [];
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

    public setPanelFrameSelected(
        dateList: Date[],
        part: string,
        type: FrameSelectedType,
        virtual: boolean = false
    ): void {

        const value = this.value.slice(0);

        dateList.forEach(date => {

            const disabled = this.isDisabled(date);

            if (disabled) {
                return;
            }

            for (let i = 0; i < value.length; i++) {

                const item = value[i];

                if (this.equalDate(item, date)) {

                    if (type !== FrameSelectedType.SELECT) {
                        value.splice(i, 1);
                    }
                    return;
                }
            }

            if (type !== FrameSelectedType.UNSELECT) {
                value.push(date);
            }
        });

        if (virtual) {
            this.trying = true;
            this.tryingDate = value;
            this.repaintPanel();
        } else {
            this.resetTryingState();
            this.emit('value-change', value);
        }
    }


    public isTrying(): boolean {
        return this.trying;
    }

    private equalValue(sourceValue: Date[], compareValue: Date[]): boolean {

        if (sourceValue.length !== compareValue.length) {
            return false;
        }

        const source = sortDate(sourceValue);
        const compare = sortDate(compareValue);

        return !source.some((item, i) => !this.equalDate(item, compare[i]));
    }

    private getIsValueValid(date: Date[]): boolean {
        return date.every(item => !this.isDisabled(item));
    }
}
