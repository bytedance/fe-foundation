/**
 * @file BasePanel Panel基类
 */
import {Emitter} from '@co-hooks/emitter';
import {
    nextDate,
    nextMonth,
    nextYear,
    prevDate,
    prevMonth,
    prevYear
} from '@co-hooks/util';
import {RangeState, SelectedRangeState} from '../util';
import {FrameSelectedType, IPanelRoot} from './BaseDate';
import {DatePanel} from './DatePanel';
import {MonthPanel} from './MonthPanel';
import {WeekPanel} from './WeekPanel';
import {YearPanel} from './YearPanel';

export interface IBasePanelOptions {
    root: IPanelRoot;
    date?: Date;
    part: string;
}

export interface IBasePanelEvent {
    repaint: [];
}

export enum PanelType {
    WEEK = 'week',
    DATE = 'date',
    MONTH = 'month',
    YEAR = 'year'
}

export abstract class BasePanel extends Emitter<IBasePanelEvent> {

    protected date: Date;

    protected readonly owner: BasePanel;

    private readonly root: IPanelRoot;

    private readonly part: string;

    private hidePrev: boolean = false;

    private hideNext: boolean = false;

    constructor(options: IBasePanelOptions, owner?: BasePanel) {

        super();

        const {root, date, part} = options;

        this.root = root;
        this.date = date || new Date();
        this.part = part;
        this.owner = owner || this;
    }

    /**
     * 同步当前日期
     * @param date 当前日期
     * @param isSilent 是否不向上冒泡
     * @param virtual 强制虚拟处理
     */
    public updateDate(date: Date, isSilent: boolean = false, virtual: boolean = false): void {

        const owner = this.owner;

        if (!isSilent && owner === this) {
            this.root.setPanelSelected(date, this.part, virtual);
        }

        if (!virtual) {
            owner.syncCurrentDate(date);
            this.root.setPanelDate(this.part, date);
        }

        owner.emit('repaint');
    }

    /**
     * 框选时间
     *
     * @param list 当前点击的项
     * @param type 框选类型
     * @param virtual 是否虚拟点击
     */
    public frameSelectDate(list: Date[], type: FrameSelectedType, virtual?: boolean): void {

        const owner = this.owner;

        if (owner === this) {
            this.root.setPanelFrameSelected(list, this.part, type, virtual);
        }
    }

    public getDate(): Date {
        return this.date;
    }

    public getPart(): string {
        return this.part;
    }

    public isDateDisabled(date: Date): boolean {
        return this.root.isDateDisabled(date, this.part);
    }

    public isWeekDisabled(date: Date): boolean {
        return this.root.isWeekDisabled(date, this.part);
    }

    public isMonthDisabled(date: Date): boolean {
        return this.root.isMonthDisabled(date, this.part);
    }

    public isYearDisabled(date: Date): boolean {
        return this.root.isYearDisabled(date, this.part);
    }

    public isWeekSelected(date: Date): boolean {
        return this.root.isWeekSelected(date);
    }

    public isDateSelected(date: Date): boolean {
        return this.root.isDateSelected(date);
    }

    public isDateToday(date: Date): boolean {
        return this.root.isToday(date);
    }

    public isMonthSelected(date: Date): boolean {
        return this.root.isMonthSelected(date);
    }

    public isYearSelected(date: Date): boolean {
        return this.root.isYearSelected(date);
    }

    public prevMonth(): void {
        this.updateDate(prevMonth(this.date), true);
    }

    public nextMonth(): void {
        this.updateDate(nextMonth(this.date), true);
    }

    public prevYear(): void {
        this.updateDate(prevYear(this.date), true);
    }

    public nextYear(): void {
        this.updateDate(nextYear(this.date), true);
    }

    public prevTenYear(): void {
        this.updateDate(prevYear(this.date, 10), true);
    }

    public nextTenYear(): void {
        this.updateDate(nextYear(this.date, 10), true);
    }

    public repaint(): void {
        this.emit('repaint');
    }

    public getStartDay(): number {
        return this.root.getStartDay();
    }

    // 选中态
    public getSelectedState(date: Date): SelectedRangeState {

        // 不是Owner的情况下，直接就是返回是否选中
        if (!this.isOwner()) {
            return this.isSelected(date, this.getPanelType())
                ? RangeState.SINGLE
                : RangeState.NONE;
        }

        return this.root.getSelectedState(date);
    }

    // 获取尝试选中的范围值
    public getTryingSelectedState(date: Date): SelectedRangeState {

        // 不是Owner的时候，不获取这个值
        if (!this.isOwner()) {
            return RangeState.NONE;
        }

        return this.root.getTryingSelectedState(date);
    }

    // OffsetTrying的是否非法
    public isInvalidTryingDate(): boolean {

        // 不是Owner的时候，不获取这个值
        if (!this.isOwner()) {
            return false;
        }

        return this.root.isInvalidTryingDate();
    }

    public setDate(date: Date): void {
        this.date = date;
    }

    /**
     * 获取当前年
     */
    public getCurrentYear(): number {
        return this.date.getFullYear();
    }

    /**
     * 获取当前月
     */
    public getCurrentMonth(): number {
        return this.date.getMonth();
    }

    public getDayList(): number[] {

        const startDay = this.getStartDay();
        const dayList: number[] = [];

        for (let i = 0; i < 7; i++) {
            dayList[i] = (i + startDay + 7) % 7;
        }

        return dayList;
    }

    public getCurrentType(): PanelType {
        return this.currentType;
    }

    public setCurrentType(type: PanelType): void {
        this.currentType = type;
        this.emit('repaint');
    }

    public setHidePrev(hidePrev: boolean): void {
        this.hidePrev = hidePrev;
        this.emit('repaint');
    }

    public setHideNext(hideNext: boolean): void {
        this.hideNext = hideNext;
        this.emit('repaint');
    }

    public getHidePrev(): boolean {
        return this.hidePrev;
    }

    public getHideNext(): boolean {
        return this.hideNext;
    }

    public getOutRangeDisabled(): boolean {
        return this.root.getOutRangeDisabled();
    }

    protected isOwner(): boolean {
        return this.owner === this;
    }

    protected getDisabledState(date: Date): SelectedRangeState {

        const type = this.getPanelType();
        const disabled = this.isDisabled(date, type);

        if (!disabled) {
            return RangeState.NONE;
        }

        const prevDisabled = this.isDateDisabled(prevDate(date));
        const nextDisabled = this.isDateDisabled(nextDate(date));

        if (prevDisabled && nextDisabled) {
            return RangeState.IN;
        }

        if (prevDisabled) {
            return RangeState.END;
        }

        if (nextDisabled) {
            return RangeState.START;
        }

        return RangeState.SINGLE;
    }

    private isDisabled(date: Date, type: PanelType): boolean {

        switch (type) {
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

    private isSelected(date: Date, type: PanelType): boolean {

        switch (type) {
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

    protected abstract syncCurrentDate(date: Date): void;

    protected abstract currentType: PanelType;

    public abstract getPanelType(): PanelType;

    public abstract getDatePanel(): DatePanel;

    public abstract getWeekPanel(): WeekPanel;

    public abstract getMonthPanel(): MonthPanel;

    public abstract getYearPanel(): YearPanel;
}
