/**
 * @file SimpleDate
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
    SimpleDate
} from '../../src';


describe('测试SimpleDate类', () => {
    const ins = new SimpleDate();
    const today = new Date();
    const panel = new DatePanel({root: ins, date: today, part: 'simple'});

    ins.setSimplePanelUpdate((root: SimpleDate, value: Date | null) => {
        ins.updatePanelDate({
            simple: value || new Date()
        });
    });

    it('测试基本构造', () => {

        expect(ins.getValue()).toEqual(null);
        expect(ins.isDateSelected(today)).toBeFalsy();
        expect(ins.isMonthSelected(today)).toBeFalsy();
        expect(ins.isYearSelected(today)).toBeFalsy();
    });

    it('测试addPanel & getPanel', () => {
        ins.addPanel(panel);

        expect(ins.getPanel('simple')).toEqual(panel);
    });

    it('测试value赋值', () => {
        const value = prevMonth(today);

        ins.updateValue(value);

        expect(ins.getValue()).toEqual(value);
        expect(ins.isDateSelected(today)).toEqual(false);
        expect(ins.isMonthSelected(today)).toEqual(false);
        expect(ins.isYearSelected(today)).toEqual(true);
        expect(ins.getPanel('simple').getDate()).toEqual(value);

        ins.updateOptions({
            isDateDisabled: (date: Date) => {
                const maxDate = nextDate(today, 1);
                return maxDate.getTime() < date.getTime();
            }
        });

        ins.updateValue(nextDate(today, 2));

        expect(ins.isInvalidTryingDate()).toBeFalsy();
    });

    it('测试设置setPanelSelected', () => {
        let newValue: Date | null = null;
        ins.addListener('value-change', (value: Date) => {
            newValue = value;
        });

        const value = new Date();
        value.setMonth(value.getMonth() - 1);

        ins.updateValue(today);
        ins.setPanelSelected(today, 'simple');
        expect(newValue).toEqual(null);

        ins.setPanelSelected(value, 'simple');
        expect(value).toEqual(newValue);
    });

    it('测试disabledFunc', () => {
        ins.updateValue(today);

        expect(ins.isDateSelected(today)).toBeTruthy();
        expect(ins.isMonthSelected(today)).toBeTruthy();
        expect(ins.isYearSelected(today)).toBeTruthy();

        ins.updateOptions({
            isDateDisabled: (date: Date) => {
                const minDate = prevDate(today, 3);
                const maxDate = nextDate(today, 3);

                return date.getTime() < minDate.getTime()
                    || date.getTime() > maxDate.getTime();
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
        ins.updateValue(today);
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
