/**
 * @file WeekPanel 周面板数据
 */

import {
    buildFromWeek,
    compareDate,
    daysInMonth,
    getFirstOfMonth,
    nextDate,
    weekOfYear
} from '@co-hooks/util';
import {
    GridRangeState,
    IPanelItemState,
    RangeState,
    RowRangeState
} from '../util';
import {BasePanel, IBasePanelOptions, PanelType} from './BasePanel';
import {DATE_COL_COUNT, DATE_ROW_COUNT, DatePanel} from './DatePanel';
import {MonthPanel} from './MonthPanel';
import {YearPanel} from './YearPanel';

export interface IWeekPanelViewDateItem {
    date: number;
    week: number;
    month: number;
    year: number;
    key: number;
    gridState: GridRangeState;
    rowState: RowRangeState;
}

export interface IWeekPanelViewItem extends IPanelItemState {
    week: number;
    key: number;
    year: number;
    dateList: IWeekPanelViewDateItem[];
}

export interface IWeekPanelViewData {
    year: number;
    month: number;
    dayList: number[];
    weekList: IWeekPanelViewItem[];
}

export class WeekPanel extends BasePanel {

    protected currentType: PanelType = PanelType.WEEK;

    private readonly monthIns: MonthPanel;

    constructor(options: IBasePanelOptions, parent?: BasePanel) {

        super(options, parent);

        this.monthIns = new MonthPanel(options, this.owner);
    }

    /**
     * 获取日期面板
     */
    public getDatePanelView(): IWeekPanelViewData {

        const weeks: IWeekPanelViewItem[] = [];
        const startDate = getFirstOfMonth(this.date, this.getStartDay());

        for (let row = 0; row < DATE_ROW_COUNT; row++) {

            const weekStart = nextDate(startDate, row * DATE_COL_COUNT);
            const weekEnd = nextDate(weekStart, 6);
            const week = weekOfYear(weekEnd, this.getStartDay(), this.getCurrentYear());
            const isWeekSelected = this.isWeekSelected(weekStart);
            const isWeekDisabled = this.isWeekDisabled(weekStart);
            const currentMonth = this.getCurrentMonth();

            let rowList: IWeekPanelViewItem = {

                key: +weekStart,
                week,
                year: this.getCurrentYear(),

                // 是否今天
                isToday: false,

                // 网格的样式类型（不支持None）;
                gridState: weekStart.getMonth() === currentMonth || weekEnd.getMonth() === currentMonth
                    ? RangeState.IN
                    : weekEnd.getMonth() !== this.getCurrentMonth() ? RangeState.NEXT : RangeState.PREV,

                // 选中的样式类型（不支持前后）
                selectedState: isWeekSelected ? RangeState.SINGLE : RangeState.NONE,

                // 尝试选中的样式类型（不支持前后）
                tryingSelectedState: RangeState.NONE,

                // 禁用的样式类型
                disabledState: isWeekDisabled ? RangeState.SINGLE : RangeState.NONE,
                dateList: []
            };

            weeks[row] = rowList;

            for (let col = 0; col < DATE_COL_COUNT; col++) {

                const curDate = nextDate(weekStart, col);

                rowList.dateList.push({

                    // 数值相关
                    week,
                    key: +curDate,
                    date: curDate.getDate(),
                    month: curDate.getMonth(),
                    year: curDate.getFullYear(),

                    // 网格的样式类型（不支持None）;
                    gridState: this.getDateGridState(curDate),

                    // 行的样式类型（只支持起、中、结束）
                    rowState: col <= 0 ? RangeState.START : col >= DATE_COL_COUNT - 1 ? RangeState.END : RangeState.IN
                });
            }
        }

        return {
            year: this.getCurrentYear(),
            month: this.getCurrentMonth(),
            dayList: this.getDayList(),
            weekList: weeks
        };
    }

    /**
     * 直接设置当前时间
     *
     * @param item 当前点击的项
     * @param virtual 是否虚拟点击
     */
    public setCurrentWeek(item: IWeekPanelViewItem, virtual?: boolean): void {

        const {week, year, disabledState} = item;

        if (disabledState !== RangeState.NONE) {
            return;
        }

        const newDate = buildFromWeek(year, week, 0, this.getStartDay());

        if (!virtual) {
            this.updateDate(newDate);
            return;
        }

        // 虚拟点击事件只有主面板生效
        this.updateDate(newDate, false, true);
    }

    public getPanelType(): PanelType {
        return PanelType.WEEK;
    }

    public getMonthPanel(): MonthPanel {
        return this.monthIns;
    }

    public getYearPanel(): YearPanel {
        return this.monthIns.getYearPanel();
    }

    public getDatePanel(): DatePanel {
        throw new Error('date panel is not support');
    }

    public getWeekPanel(): WeekPanel {
        return this;
    }

    protected syncCurrentDate(date: Date): void {
        this.setDate(date);
        this.getMonthPanel().setDate(date);
        this.getYearPanel().setDate(date);
    }

    private getDateGridState(date: Date): GridRangeState {

        if (compareDate(PanelType.MONTH, date, this.date) < 0) {
            return RangeState.PREV;
        }

        if (compareDate(PanelType.MONTH, date, this.date) > 0) {
            return RangeState.NEXT;
        }

        if (date.getDate() === 1) {
            return RangeState.START;
        }

        if (date.getDate() === daysInMonth(date.getFullYear(), date.getMonth())) {
            return RangeState.END;
        }

        return RangeState.IN;
    }
}
