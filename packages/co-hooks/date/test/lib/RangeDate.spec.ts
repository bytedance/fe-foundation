/**
 * @file RangeDate.spec
 */

import {nextDate, nextMonth, nextYear, prevDate, prevMonth, prevYear} from '@co-hooks/util';
import {DateSelectedType, PanelType, RangeDate} from '../../src';

describe('测试RangeDate类', () => {
    let ins = new RangeDate();
    let today = new Date();

    let leftPanel = ins.createPanel(PanelType.DATE, 'left');
    let rightPanel = ins.createPanel(PanelType.DATE, 'right');

    beforeEach(() => {
        ins = new RangeDate();
        today = new Date();

        leftPanel = ins.createPanel(PanelType.DATE, 'left');
        rightPanel = ins.createPanel(PanelType.DATE, 'right');

        ins.setRangePanelUpdate((root: RangeDate, value: Date[]) => {
            if (!value.length) {
                return;
            }

            const [start, end] = value;
            ins.updatePanelDate({
                left: start,
                right: start.getMonth() === end.getMonth() ? nextMonth(start) : end
            });
        });
    });

    it('测试构造函数', () => {
        const {value} = ins.getInstance();

        expect(value).toEqual([]);
        expect(ins.isDateSelected(today)).toBeFalsy();
        expect(ins.isMonthSelected(today)).toBeFalsy();
        expect(ins.isYearSelected(today)).toBeFalsy();
    });

    it('测试getPanel', () => {
        expect(ins.getPanel('left')).toEqual(leftPanel);
        expect(ins.getPanel('right')).toEqual(rightPanel);
    });

    it('测试value赋值', () => {
        const value = [nextDate(today), prevDate(today)];

        ins.updateValue(value);

        expect(ins.getInstance().value).toEqual([prevDate(today), nextDate(today)]);
        expect(ins.isDateSelected(today)).toBeTruthy();
        expect(ins.isMonthSelected(today)).toBeTruthy();
        expect(ins.isYearSelected(today)).toBeTruthy();
        expect(ins.getSelectedState(prevDate(today, 2))).toEqual(DateSelectedType.NORMAL);
        expect(ins.getSelectedState(nextDate(today, 2))).toEqual(DateSelectedType.NORMAL);
        expect(ins.getSelectedState(prevDate(today))).toEqual(DateSelectedType.START_RANGE);
        expect(ins.getSelectedState(today)).toEqual(DateSelectedType.IN_RANGE);
        expect(ins.getSelectedState(nextDate(today))).toEqual(DateSelectedType.END_RANGE);
        expect(ins.getPanel('left').getDate()).toEqual(value[0]);
        expect(ins.getPanel('right').getDate()).toEqual(
            prevDate(today).getMonth() === nextDate(today).getMonth()
                ? nextMonth(prevDate(today))
                : nextDate(today)
        );

        ins.updateOptions({
            isDateDisabled: (date: Date) => {
                const maxDate = nextDate(today, 1);
                return date.getTime() > maxDate.getTime();
            }
        });

        ins.updateValue([today, nextDate(today, 2)]);

        expect(ins.isInvalidTryingDate()).toBeFalsy();

        ins.updateValue([]);
        expect(ins.getInstance().value).toEqual([]);
    });

    it('测试设置setPanelSelected&offset=false', () => {
        let newValue: Date[] = [];
        ins.addListener('value-change', (value: Date[]) => {
            newValue = value;
        });

        ins.updateOptions({
            isDateDisabled: (date: Date) => {
                const maxDate = nextDate(today);
                return date.getTime() > maxDate.getTime();
            }
        });

        // disabled date不能add
        ins.setPanelSelected(nextDate(today, 2));
        expect(ins.getInstance().innerValue).toEqual([]);

        // 添加1个date
        ins.setPanelSelected(today);
        expect(ins.getInstance().innerValue).toEqual([today]);

        // 添加个trying
        ins.setPanelSelected(prevDate(today, 3), '', true);
        expect(ins.getInstance().trying).toBeTruthy();
        expect(ins.getInstance().tryingDate).toEqual([prevDate(today, 3), today]);
        expect(ins.isInvalidTryingDate()).toBeTruthy();

        ins.setPanelSelected(nextDate(today, 2), '', true);
        expect(ins.getInstance().trying).toBeTruthy();
        expect(ins.getInstance().tryingDate).toEqual([today, nextDate(today, 2)]);
        expect(ins.isInvalidTryingDate()).toBeFalsy();

        // 添加第二个
        ins.setPanelSelected(prevMonth(today));
        expect(ins.getInstance().innerValue).toEqual([]);
        expect(newValue).toEqual([prevMonth(today), today]);
        expect(ins.getInstance().trying).toBeFalsy();
        expect(ins.getInstance().tryingDate).toEqual([]);

        let startValue: Date | null = null;
        ins.addListener('add-start-value', start => {
            startValue = start;
            ins.setPanelSelected(prevDate(today, 10));
        });

        // 测试自定义end功能
        ins.setPanelSelected(prevDate(today));
        expect(newValue).toEqual([prevDate(today, 10), prevDate(today)]);
        expect(startValue).toEqual(prevDate(today));
        expect(ins.getInstance().innerValue).toEqual([]);
    });

    it('测试设置setPanelSelected&offset=2', () => {
        let newValue: Date[] = [];
        ins.addListener('value-change', (value: Date[]) => {
            newValue = value;
        });

        ins.updateOptions({offset: 2});
        ins.updateValue([]);

        ins.updateOptions({
            isDateDisabled: (date: Date) => {
                const maxDate = nextDate(today);
                return date.getTime() > maxDate.getTime();
            }
        });

        // disabled date不能add
        ins.setPanelSelected(nextDate(today, 2));
        expect(ins.getInstance().innerValue).toEqual([]);

        // 提交合法
        ins.setPanelSelected(prevDate(today, 2));
        console.log(prevDate(today, 1));
        console.log(prevDate(today, 0));
        console.log(today);
        expect(newValue).toEqual([prevDate(today, 2), prevDate(today)]);
        expect(ins.isTrying()).toBeFalsy();

        // 提交非法
        ins.setPanelSelected(nextDate(today));
        expect(ins.isTrying()).toBeTruthy();
        expect(ins.isInvalidTryingDate()).toBeFalsy();
        expect(ins.getInstance().tryingDate).toEqual([nextDate(today), nextDate(today, 2)]);

        // try合法
        ins.setPanelSelected(prevDate(today, 4), '', true);
        expect(ins.isTrying()).toBeTruthy();
        expect(ins.getInstance().tryingDate).toEqual([prevDate(today, 4), prevDate(today, 3)]);
        expect(ins.isInvalidTryingDate()).toBeTruthy();

        // try非法
        ins.setPanelSelected(nextDate(today), '', true);
        expect(ins.isTrying()).toBeTruthy();
        expect(ins.getInstance().tryingDate).toEqual([nextDate(today), nextDate(today, 2)]);
        expect(ins.isInvalidTryingDate()).toBeFalsy();
    });

    it('测试disabledFunc', () => {
        ins.updateValue([prevDate(today), today]);

        expect(ins.isDateSelected(today)).toBeTruthy();
        expect(ins.isMonthSelected(today)).toBeTruthy();
        expect(ins.isYearSelected(today)).toBeTruthy();

        ins.updateOptions({
            isDateDisabled: (date: Date) => {
                const minDate = prevDate(today, 3);
                const maxDate = nextDate(today, 3);
                return date.getTime() > maxDate.getTime()
                    || date.getTime() < minDate.getTime();
            }
        });

        expect(ins.isDateDisabled(prevDate(today, 4))).toEqual(true);
        expect(ins.isDateDisabled(nextDate(today, 4))).toEqual(true);
        expect(ins.isDateDisabled(prevDate(today, 3))).toEqual(false);

        ins.updateOptions({
            isMonthDisabled: (date: Date) => {
                const minDate = prevMonth(today, 3);
                const maxDate = nextMonth(today, 3);

                const dateStr = `${date.getFullYear()}_${date.getMonth() + 10}`;
                return `${minDate.getFullYear()}_${minDate.getMonth() + 10}` > dateStr
                    || `${maxDate.getFullYear()}_${maxDate.getMonth() + 10}` < dateStr;
            }
        });

        expect(ins.isMonthDisabled(prevMonth(today, 4))).toBeTruthy();
        expect(ins.isMonthDisabled(today)).toBeFalsy();
        expect(ins.isMonthDisabled(nextMonth(today, 4))).toBeTruthy();

        ins.updateOptions({
            isYearDisabled: (date: Date) => {
                const minDate = prevYear(today, 3);
                const maxDate = nextYear(today, 3);

                return date.getFullYear() < minDate.getFullYear()
                    || date.getFullYear() > maxDate.getFullYear();
            }
        });

        expect(ins.isYearDisabled(prevYear(today, 4))).toBeTruthy();
        expect(ins.isYearDisabled(today)).toBeFalsy();
        expect(ins.isYearDisabled(nextYear(today, 4))).toBeTruthy();
    });
});
