/**
 * @file MultipleDate
 */
import {
    nextDate,
    nextMonth,
    nextYear,
    prevDate,
    prevMonth,
    prevYear
} from '@co-hooks/util';
import {
    DatePanel,
    DateSelectedType,
    MultipleDate
} from '../../src';


describe('测试MultipleDate类', () => {
    const ins = new MultipleDate();
    const today = new Date();
    const panel = new DatePanel({root: ins, date: today, part: 'multiple'});
    const panel2 = new DatePanel({root: ins, date: today, part: 'multiple2'});

    ins.setRangePanelUpdate((root: MultipleDate, value: Date[]) => {
        ins.updatePanelDate({
            multiple: value[0] || new Date(),
            multiple2: value[0] || new Date()
        });
    });

    it('测试构造函数', () => {
        expect(ins.getValue()).toEqual([]);
        expect(ins.isDateSelected(today)).toBeFalsy();
        expect(ins.isMonthSelected(today)).toBeFalsy();
        expect(ins.isYearSelected(today)).toBeFalsy();
    });

    it('测试addPanel & getPanel', () => {
        ins.addPanel(panel);
        ins.addPanel(panel2);

        expect(ins.getPanel('multiple')).toEqual(panel);
        expect(ins.getPanel('multiple2')).toEqual(panel2);
    });

    it('测试value赋值', () => {
        const value = [prevMonth(today)];

        ins.updateValue(value);

        expect(ins.getValue()).toEqual(value);
        expect(ins.isDateSelected(today)).toEqual(false);
        expect(ins.isMonthSelected(today)).toEqual(false);
        expect(ins.isYearSelected(today)).toEqual(true);
        expect(ins.getPanel('multiple').getDate()).toEqual(value[0]);
        expect(ins.getPanel('multiple2').getDate()).toEqual(value[0]);

        ins.updateOptions({
            isDateDisabled: (date: Date) => {
                const maxDate = nextDate(today, 1);
                return date.getTime() > maxDate.getTime();
            }
        });

        ins.updateValue([nextDate(today, 2)]);

        expect(ins.isInvalidTryingDate()).toBeFalsy();

        ins.updateValue([]);
        expect(ins.getValue()).toEqual([]);
    });

    it('测试设置setPanelSelected', () => {
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
        ins.updateValue([prevMonth(today)]);
        ins.setPanelSelected(nextDate(today, 2), 'multiple');
        expect(newValue).toEqual([]);

        // 添加未selected date
        ins.setPanelSelected(today, 'multiple');
        expect([prevMonth(today), today]).toEqual(newValue);

        // 取消已选择selected date
        ins.updateValue([prevMonth(today), today]);
        ins.setPanelSelected(today, 'multiple');
        expect([prevMonth(today)]).toEqual(newValue);
    });

    it('测试disabledFunc', () => {
        ins.updateValue([today]);

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

    it('测试getSelectedType', () => {
        ins.updateValue([today]);
        ins.updateOptions({
            isDateDisabled: (date: Date) => {
                const minDate = prevDate(today, 1);

                return date.getTime() < minDate.getTime();
            }
        });

        expect(ins.getSelectedState(today)).toEqual(DateSelectedType.SINGLE);
        expect(ins.getSelectedState(nextDate(today))).toEqual(DateSelectedType.NORMAL);
        expect(ins.getSelectedState(prevDate(today, 2))).toEqual(DateSelectedType.NORMAL);
    });
});
