/**
 * @file YearPanel 年面板数据
 */
import {nextYear} from '@co-hooks/util';
import {GridRangeState, IPanelItemState, RangeState} from '../util';
import {BasePanel, PanelType} from './BasePanel';
import {DatePanel} from './DatePanel';
import {MonthPanel} from './MonthPanel';
import {WeekPanel} from './WeekPanel';

export interface IYearPanelViewItem extends IPanelItemState {
    key: number;
    year: number;
}

const YEAR_ITEM_COUNT = 3 * 4;

export interface IYearPanelViewData {
    startYear: number;
    endYear: number;
    yearList: IYearPanelViewItem[][];
}

export class YearPanel extends BasePanel {

    protected currentType: PanelType = PanelType.YEAR;

    public getYearPanelView(): IYearPanelViewData {

        const list: IYearPanelViewItem[][] = [];
        const year = (this.date.getFullYear() / 10 | 0) * 10 - 1;
        const startDate = new Date(year, 0, 1);

        for (let i = 0; i < YEAR_ITEM_COUNT; i++) {

            const row = Math.floor(i / 3);
            const col = i % 3;
            const rowList = list[row] || [];
            const curDate = nextYear(startDate, i);

            rowList.push({
                key: +curDate,
                year: curDate.getFullYear(),

                // 是否今天
                isToday: false,

                // 网格的样式类型（不支持None）;
                gridState: this.getYearGridState(curDate),

                // 选中的样式类型（不支持前后）
                selectedState: this.getSelectedState(curDate),

                // 尝试选中的样式类型（不支持前后）
                tryingSelectedState: this.getTryingSelectedState(curDate),

                // 禁用的样式类型
                disabledState: this.getDisabledState(curDate)
            });

            if (col === 0) {
                list[row] = rowList;
            }
        }

        return {
            startYear: year + 1,
            endYear: year + 10,
            yearList: list
        };
    }

    /**
     * 直接设置当前时间
     *
     * @param item 当前点击的项
     * @param virtual 是否虚拟点击
     */
    public setCurrentYear(item: IYearPanelViewItem, virtual?: boolean): void {

        const {year, disabledState} = item;

        if (disabledState !== RangeState.NONE) {
            return;
        }

        const newDate = new Date(year, this.getCurrentMonth(), 1);

        if (!virtual) {
            this.updateDate(newDate);
            return;
        }

        // 虚拟点击事件只有主面板生效
        this.updateDate(newDate, false, true);

    }

    public getPanelType(): PanelType {
        return PanelType.YEAR;
    }

    public getDatePanel(): DatePanel {
        throw new Error('date panel is not support');
    }

    public getMonthPanel(): MonthPanel {
        throw new Error('month panel is not support');
    }

    public getWeekPanel(): WeekPanel {
        throw new Error('week panel is not support');
    }

    public getYearPanel(): YearPanel {
        return this;
    }

    protected syncCurrentDate(date: Date): void {
        this.setDate(date);
    }

    private getYearGridState(date: Date): GridRangeState {

        const startYear = (this.date.getFullYear() / 10 | 0) * 10 - 1;
        const year = date.getFullYear();

        if (startYear === year) {
            return RangeState.PREV;
        }

        if (year === startYear + 11) {
            return RangeState.NEXT;
        }

        if (year === startYear + 1) {
            return RangeState.START;
        }

        if (year === startYear + 10) {
            return RangeState.END;
        }

        return RangeState.IN;
    }
}
