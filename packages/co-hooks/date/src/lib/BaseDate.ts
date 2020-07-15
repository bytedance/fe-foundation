/**
 * @file BaseDate
 */

import {Emitter} from '@co-hooks/emitter';
import {compareDate, nextDate, nextMonth, nextYear, weekStart} from '@co-hooks/util';
import {RangeState, SelectedRangeState} from '../util';
import {BasePanel, PanelType} from './BasePanel';
import {DatePanel} from './DatePanel';
import {MonthPanel} from './MonthPanel';
import {WeekPanel} from './WeekPanel';
import {YearPanel} from './YearPanel';

export type IsDisabledFun = (date: Date) => boolean;

export interface IBaseDateOptions {
    outRangeDisabled?: boolean;
    needRangeValid?: boolean;
    isDateDisabled?: IsDisabledFun;
    isMonthDisabled?: IsDisabledFun;
    isYearDisabled?: IsDisabledFun;
    disabled?: boolean;
    startDay?: number;
}

export interface ISetPanelDateEventParams {
    part: string;
    date: Date;
}

export interface IBaseDateEvent {
    'set-panel-date': [ISetPanelDateEventParams];
}

export enum FrameSelectedType {
    REVERSE,
    SELECT,
    UNSELECT
}

export interface IPanelRoot {

    updateValue(value?: Date | Date[]): void;

    isInvalidTryingDate(): boolean;

    getSelectedState(date: Date): SelectedRangeState;

    getTryingSelectedState(date: Date): SelectedRangeState;

    getStartDay(): number;

    getPanel(part: string): BasePanel;

    getAllPanel(): {[key: string]: BasePanel};

    createPanel(panelType: PanelType, part: string): BasePanel;

    isDateSelected(date: Date): boolean;

    isWeekDisabled(date: Date, part: string): boolean;

    isMonthSelected(date: Date): boolean;

    isYearSelected(date: Date): boolean;

    isGlobalDisabled(): boolean;

    isDateDisabled(date: Date, part: string): boolean;

    isWeekSelected(date: Date): boolean;

    isMonthDisabled(date: Date, part: string): boolean;

    isYearDisabled(date: Date, part: string): boolean;

    repaintPanel(): void;

    setPanelSelected(date: Date, part: string, virtual?: boolean): void;

    setPanelFrameSelected(dateList: Date[],part: string,  type: FrameSelectedType, virtual?: boolean): void;

    isTrying(): boolean;

    isToday(date: Date): boolean;

    getOutRangeDisabled(): boolean;

    setPanelDate(part: string, date: Date): void;
}

export abstract class BaseDate<T extends IBaseDateEvent> extends Emitter<T> implements IPanelRoot {

    protected panelMap: {[key: string]: BasePanel} = {};

    protected startDay: number = 0;

    protected isValueValid: boolean = true;

    protected outRangeDisabled: boolean = false;

    protected panelType: PanelType;

    protected needRangeValid: boolean = false;

    protected disabled: boolean = false;

    constructor(panelType: PanelType) {
        super();
        this.panelType = panelType;
    }

    public isTrying(): boolean {
        return false;
    }

    public isInvalidTryingDate(): boolean {
        return false;
    }

    public addPanel(panel: BasePanel): void {
        const part = panel.getPart();
        this.panelMap[part] = panel;
    }

    public createPanel(panelType: PanelType, part: string): BasePanel {

        switch (panelType) {
            case PanelType.DATE:
                return this.createDatePanel(part);
            case PanelType.WEEK:
                return this.createWeekPanel(part);
            case PanelType.MONTH:
                return this.createMonthPanel(part);
            case PanelType.YEAR:
                return this.createYearPanel(part);
            default:
                return this.createDatePanel(part);
        }
    }

    public createDatePanel(part: string): BasePanel {
        const panel = new DatePanel({root: this, part});
        this.addPanel(panel);

        return panel;
    }

    public createMonthPanel(part: string): MonthPanel {
        const panel = new MonthPanel({root: this, part});
        this.addPanel(panel);

        return panel;
    }

    public createYearPanel(part: string): YearPanel {
        const panel = new YearPanel({root: this, part});
        this.addPanel(panel);

        return panel;
    }

    public createWeekPanel(part: string): WeekPanel {
        const panel = new WeekPanel({root: this, part});
        this.addPanel(panel);

        return panel;
    }

    public updateOptions(options: IBaseDateOptions): void {

        const {
            outRangeDisabled = false,
            needRangeValid = false,
            isDateDisabled = this.isDateDisabled,
            isMonthDisabled = this.isMonthDisabled,
            isYearDisabled = this.isYearDisabled,
            startDay = 0,
            disabled = false
        } = options;

        this.startDay = startDay;
        this.needRangeValid = needRangeValid;
        this.isDateDisabled = disabled ? () => true : isDateDisabled;
        this.isMonthDisabled = disabled ? () => true : isMonthDisabled;
        this.isYearDisabled = disabled ? () => true : isYearDisabled;
        this.outRangeDisabled = outRangeDisabled;
        this.disabled = disabled;

        this.repaintPanel();
    }

    public getStartDay(): number {
        return this.startDay;
    }

    public isToday(date: Date): boolean {
        return this.equalDate(date, new Date(), PanelType.DATE);
    }

    public getPanel(part: string): BasePanel {

        const panel = this.panelMap[part];

        if (!panel) {
            throw new Error(`part=${part} panel is not under current RangeDate`);
        }

        return panel;
    }

    public getAllPanel(): {[key: string]: BasePanel} {
        return this.panelMap;
    }

    public getOutRangeDisabled(): boolean {
        return this.outRangeDisabled;
    }

    public setPanelDate(part: string, date: Date): void {
        this.emit('set-panel-date', {part, date});
    }

    public isGlobalDisabled(): boolean {
        return this.disabled;
    }

    public isDateDisabled(date: Date): boolean {
        return false;
    }

    public isWeekDisabled(startDate: Date): boolean {

        let date = weekStart(startDate, this.getStartDay());
        const needRangeValid = this.needRangeValid;

        for (let i = 0; i < 7; i++) {

            const disabled = this.isDateDisabled(date);

            if (needRangeValid && disabled) {
                return true;
            }

            if (!needRangeValid && !disabled) {
                return false;
            }

            date = nextDate(date);
        }

        return !needRangeValid;
    }

    public isMonthDisabled(date: Date): boolean {
        return false;
    }

    public isYearDisabled(date: Date): boolean {
        return false;
    }

    // 除非是offset不为0的Range，其他情况下无效
    public getTryingSelectedState(date: Date): SelectedRangeState {
        return RangeState.NONE;
    }

    // 只在Multiple下生效
    public setPanelFrameSelected(dateList: Date[], part: string, type: FrameSelectedType, virtual?: boolean): void {
        this.setPanelSelected(dateList[0], part, virtual);
    }

    public repaintPanel(): void {
        Object.keys(this.panelMap).forEach(part => {
            this.panelMap[part].repaint();
        });
    }

    // 比较日期大小
    protected compareDate(date1?: Date | null, date2?: Date | null, panelType?: PanelType): number {

        if (date1 == null && date2 == null) {
            return 0;
        }

        if (date1 == null) {
            return -1;
        }

        if (date2 == null) {
            return 1;
        }

        return compareDate(panelType || this.panelType, date1, date2, this.startDay);
    }

    // 比较日期是否相同
    protected equalDate(date1?: Date | null, date2?: Date | null, panelType?: PanelType): boolean {
        return this.compareDate(date1, date2, panelType) === 0;
    }

    // 比较是不是date1<date2
    protected lessThanDate(data1?: Date | null, date2?: Date | null, panelType?: PanelType): boolean {
        return this.compareDate(data1, date2, panelType) < 0;
    }

    // 比较是不是data1>date2
    protected greaterThanDate(data1?: Date | null, date2?: Date | null, panelType?: PanelType): boolean {
        return this.compareDate(data1, date2, panelType) > 0;
    }

    protected isDisabled(date: Date): boolean {

        switch (this.panelType) {
            case PanelType.DATE:
                return this.isDateDisabled(date);
            case PanelType.MONTH:
                return this.isMonthDisabled(date);
            case PanelType.YEAR:
                return this.isYearDisabled(date);
            case PanelType.WEEK:
                return this.isWeekDisabled(date);
        }
    }

    protected isSelected(date: Date): boolean {

        switch (this.panelType) {
            case PanelType.DATE:
                return this.isDateSelected(date);
            case PanelType.MONTH:
                return this.isMonthSelected(date);
            case PanelType.YEAR:
                return this.isYearSelected(date);
            case PanelType.WEEK:
                return this.isWeekSelected(date);
        }
    }

    protected nextDate(date: Date, offset: number = 1): Date {


        switch (this.panelType) {
            case PanelType.DATE:
                return nextDate(date, offset);
            case PanelType.MONTH:
                return nextMonth(date, offset);
            case PanelType.YEAR:
                return nextYear(date, offset);
            case PanelType.WEEK:
                return nextDate(date, offset * 7);
        }
    }

    protected prevDate(date: Date, offset: number = 1): Date {
        return this.nextDate(date, -offset);
    }

    public abstract updateValue(value?: Date | Date[]): void;

    public abstract getSelectedState(date: Date): SelectedRangeState;

    public abstract isDateSelected(date: Date): boolean;

    public abstract isMonthSelected(date: Date): boolean;

    public abstract isYearSelected(date: Date): boolean;

    public abstract isWeekSelected(date: Date): boolean;

    public abstract setPanelSelected(date: Date, part: string, virtual?: boolean): void;
}
