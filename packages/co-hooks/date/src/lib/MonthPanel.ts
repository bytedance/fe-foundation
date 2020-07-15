/**
 * @file MonthPanel 月面板
 */
import {nextMonth} from '@co-hooks/util';
import {GridRangeState, IPanelItemState, RangeState} from '../util';
import {BasePanel, IBasePanelOptions, PanelType} from './BasePanel';
import {DatePanel} from './DatePanel';
import {WeekPanel} from './WeekPanel';
import {YearPanel} from './YearPanel';

export interface IMonthPanelViewItem extends IPanelItemState {
    key: number;
    month: number;
    year: number;
}

const MONTH_ITEM_COUNT = 3 * 4;

export interface IMonthPanelViewData {
    year: number;
    monthList: IMonthPanelViewItem[][];
}

export class MonthPanel extends BasePanel {

    protected currentType: PanelType = PanelType.MONTH;

    private readonly yearIns: YearPanel;

    constructor(options: IBasePanelOptions, parent?: BasePanel) {

        super(options, parent);

        this.yearIns = new YearPanel(options, this.owner);
    }

    public getMonthPanelView(): IMonthPanelViewData {

        const monthList: IMonthPanelViewItem[][] = [];
        const year = this.date.getFullYear();
        const startDate = new Date(year, 0, 1);

        for (let i = 0; i < MONTH_ITEM_COUNT; i++) {

            const row = Math.floor(i / 3);
            const col = i % 3;
            const rowList = monthList[row] || [];
            const curDate = nextMonth(startDate, i);

            rowList.push({
                key: +curDate,
                month: i,
                year,

                // 是否今天
                isToday: false,

                // 网格的样式类型（不支持None）;
                gridState: this.getMonthGridState(curDate),

                // 选中的样式类型（不支持前后）
                selectedState: this.getSelectedState(curDate),

                // 尝试选中的样式类型（不支持前后）
                tryingSelectedState: this.getTryingSelectedState(curDate),

                // 禁用的样式类型
                disabledState: this.getDisabledState(curDate)
            });

            if (col === 0) {
                monthList[row] = rowList;
            }
        }

        return {
            year,
            monthList
        };
    }

    /**
     * 直接设置当前时间
     *
     * @param item 当前点击的项
     * @param virtual 是否虚拟点击
     */
    public setCurrentMonth(item: IMonthPanelViewItem, virtual?: boolean): void {

        const {year, month, disabledState} = item;

        if (disabledState !== RangeState.NONE) {
            return;
        }

        const newDate = new Date(year, month, 1);

        if (!virtual) {
            this.updateDate(newDate);
            return;
        }

        // 虚拟点击事件只有主面板生效
        this.updateDate(newDate, false, true);

    }

    public getPanelType(): PanelType {
        return PanelType.MONTH;
    }

    public getDatePanel(): DatePanel {
        throw new Error('date panel is not support');
    }

    public getMonthPanel(): MonthPanel {
        return this;
    }

    public getWeekPanel(): WeekPanel {
        throw new Error('week panel is not support');
    }

    public getYearPanel(): YearPanel {
        return this.yearIns;
    }

    protected syncCurrentDate(date: Date): void {
        this.setDate(date);
        this.yearIns.setDate(this.date);
    }

    private getMonthGridState(date: Date): GridRangeState {

        const month = date.getMonth();

        if (month === 0) {
            return RangeState.START;
        }

        if (month === 11) {
            return RangeState.END;
        }

        return RangeState.IN;
    }
}
