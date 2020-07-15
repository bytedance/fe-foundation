/**
 * @file DatePanel 日期面板数据
 */

import {
    compareDate, daysInMonth,
    getFirstOfMonth,
    nextDate
} from '@co-hooks/util';
import {GridRangeState, IPanelItemState, RangeState} from '../util';
import {BasePanel, IBasePanelOptions, PanelType} from './BasePanel';
import {MonthPanel} from './MonthPanel';
import {WeekPanel} from './WeekPanel';
import {YearPanel} from './YearPanel';

export interface IDatePanelViewItem extends IPanelItemState {
    date: number;
    week: number;
    month: number;
    year: number;
    key: number;
}

export interface IDatePanelViewData {
    year: number;
    month: number;
    dayList: number[];
    dateList: IDatePanelViewItem[][];
}

export const DATE_ROW_COUNT = 6;

export const DATE_COL_COUNT = 7;

export class DatePanel extends BasePanel {

    protected currentType: PanelType = PanelType.DATE;

    private readonly monthIns: MonthPanel;

    constructor(options: IBasePanelOptions, parent?: BasePanel) {

        super(options, parent);

        this.monthIns = new MonthPanel(options, this.owner);
    }

    /**
     * 获取日期面板
     */
    public getDatePanelView(): IDatePanelViewData {

        const dateList: IDatePanelViewItem[][] = [];
        const startDate = getFirstOfMonth(this.date, this.getStartDay());

        for (let row = 0; row < DATE_ROW_COUNT; row++) {

            const weekStart = nextDate(startDate, row * DATE_COL_COUNT);
            const rowList: IDatePanelViewItem[] = [];

            dateList[row] = rowList;

            for (let col = 0; col < DATE_COL_COUNT; col++) {

                const curDate = nextDate(weekStart, col);

                rowList.push({

                    // 数值相关
                    key: +curDate,
                    week: 0,
                    date: curDate.getDate(),
                    month: curDate.getMonth(),
                    year: curDate.getFullYear(),

                    // 是否今天
                    isToday: this.isDateToday(curDate),

                    // 网格的样式类型（不支持None）;
                    gridState: this.getDateGridState(curDate),

                    // 选中的样式类型（不支持前后）
                    selectedState: this.getSelectedState(curDate),

                    // 尝试选中的样式类型（不支持前后）
                    tryingSelectedState: this.getTryingSelectedState(curDate),

                    // 禁用的样式类型
                    disabledState: this.getDisabledState(curDate)
                });
            }
        }

        return {
            year: this.getCurrentYear(),
            month: this.getCurrentMonth(),
            dayList: this.getDayList(),
            dateList
        };
    }

    /**
     * 直接设置当前时间
     *
     * @param item 当前点击的项
     * @param virtual 是否虚拟点击
     */
    public setCurrentDate(item: IDatePanelViewItem, virtual?: boolean): void {

        const {date, month, year, disabledState} = item;

        if (disabledState !== RangeState.NONE) {
            return;
        }

        const newDate = new Date(year, month, date);

        if (!virtual) {
            this.updateDate(newDate);
            return;
        }

        // 虚拟点击事件只有主面板生效
        this.updateDate(newDate, false, true);

    }

    // region Panel相关
    public getPanelType(): PanelType {
        return PanelType.DATE;
    }

    public getDatePanel(): DatePanel {
        return this;
    }

    public getMonthPanel(): MonthPanel {
        return this.monthIns;
    }

    public getWeekPanel(): WeekPanel {
        throw new Error('week panel is not support');
    }

    public getYearPanel(): YearPanel {
        return this.monthIns.getYearPanel();
    }

    // endregion Panel相关

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
