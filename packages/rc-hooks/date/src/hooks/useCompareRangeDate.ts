/**
 * @file useCompareRangeDate
 */

import {useRefCallback, useRefGetter, useSingleton} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {IDateLocale, formatDate, parseDate, parseDateArr} from '@co-hooks/util';
import {
    CompareRangeDate,
    IBaseDateOptions,
    ICompareRangeDateInnerValue,
    PanelType,
    RangePanelUpdater,
    SetPanelDate
} from '@co-hooks/date';
import {DatePresetEvent, IDatePresetItem} from './useSimpleDate';

export type CompareRangeDateChange = (value: ICompareRangeDateValue) => void;

export interface ICompareRangeDateValue {
    source: string[];
    isCompare: boolean;
    target: string[];
}

export interface ICompareRangeDateOptions extends IBaseDateOptions {
    locale: IDateLocale;
    format?: string;
    sourceOffset?: number;
    targetOffset?: number;
    value?: ICompareRangeDateValue;
    onChange?: CompareRangeDateChange;
    onUpdatePanelDate: RangePanelUpdater;
    onSetPanelDate?: SetPanelDate;
    getDefaultTargetBySource?: (source: Date[]) => Date[];
    parts: string[];
    panelType: PanelType;
}

export interface IUseCompareRangeDateResult {
    root: CompareRangeDate;
    onSetSourcePresetTrying: DatePresetEvent;
    onCancelSourcePresetTrying: DatePresetEvent;
    onSetSourcePreset: DatePresetEvent;
    onSetTargetPresetTrying: DatePresetEvent;
    onCancelTargetPresetTrying: DatePresetEvent;
    onSetTargetPreset: DatePresetEvent;
}

export function useCompareRangeDate(options: ICompareRangeDateOptions): IUseCompareRangeDateResult {

    const {
        value = {},
        format,
        locale,
        onChange,
        onUpdatePanelDate,
        onSetPanelDate,
        getDefaultTargetBySource,
        startDay,
        panelType,
        parts,
        ...extra
    } = options;

    const root = useSingleton(() => new CompareRangeDate(panelType, parts));
    const {source = [], isCompare = false, target = []} = value as ICompareRangeDateValue;

    const onChangeCallback = useRefCallback(onChange);
    const formatGetter = useRefGetter(format == null ? locale.defaultFormat[PanelType.DATE] : format);
    const getDefaultTargetBySourceGetter = useRefGetter(getDefaultTargetBySource);

    const sourceValue: Date[] = parseDateArr(source, formatGetter(), locale, panelType === PanelType.DATE);
    const targetValue: Date[] = parseDateArr(target, formatGetter(), locale, panelType === PanelType.DATE);

    root.updateOptions({
        ...extra,
        startDay: startDay == null ? locale.startDay : startDay
    });
    root.setRangePanelUpdate(onUpdatePanelDate);
    root.setSetPanelDate(onSetPanelDate);
    root.updateValue({source: sourceValue, isCompare, target: targetValue});

    useEffect(() => {

        const callback = (newVal: ICompareRangeDateInnerValue): void => {

            const fn = getDefaultTargetBySourceGetter();
            onChangeCallback({
                source: newVal.source.map((item: Date) => formatDate(item, formatGetter(), locale)),
                isCompare: newVal.isCompare,
                target: (
                    newVal.target.length ? newVal.target : newVal.isCompare && fn ? fn(newVal.source) : []
                ).map((item: Date) => formatDate(item, formatGetter(), locale))
            });
        };

        root.addListener('value-change', callback);

        return () => {
            root.removeListener('value-change', callback);
            root.dispose();
        };
    }, []);

    const onSetSourcePresetTrying = useCallback((preset: IDatePresetItem) => {
        if (!preset.value.length) {
            return;
        }

        const newVal = parseDateArr(preset.value, formatGetter(), locale, panelType === PanelType.DATE);

        root.sourceRangeDate.setPresetTrying(newVal);

    }, []);

    const onCancelSourcePresetTrying = useCallback(() => {
        root.sourceRangeDate.resetPresetTrying();
    }, []);

    const onSetSourcePreset = useCallback((preset: IDatePresetItem) => {

        const newValDate = preset.value.map((item: Date | string) => {
            if (typeof item === 'string') {
                const d = parseDate(item, formatGetter(), locale);

                if (d == null) {
                    throw new Error('invalid date string');
                }

                return d;
            }

            return item;
        });

        const targetNewVal = getDefaultTargetBySource ? getDefaultTargetBySource(newValDate) : [];

        onChangeCallback({
            source: newValDate.map(item => formatDate(item, formatGetter(), locale)),
            isCompare: root.getIsCompare(),
            target: targetNewVal.map(item => formatDate(item, formatGetter(), locale))
        });
    }, []);

    const onSetTargetPresetTrying = useCallback((preset: IDatePresetItem) => {

        if (!preset.value.length) {
            return;
        }

        const newVal = parseDateArr(preset.value, formatGetter(), locale, panelType === PanelType.DATE);

        root.targetRangeDate.setPresetTrying(newVal);
    }, []);

    const onCancelTargetPresetTrying = useCallback(() => {
        root.targetRangeDate.resetPresetTrying();
    }, []);

    const onSetTargetPreset = useCallback((preset: IDatePresetItem) => {
        const newVal = preset.value.map((item: Date | string) => {
            if (typeof item !== 'string') {
                return formatDate(item, formatGetter(), locale);
            }

            return item;
        });

        onChangeCallback({
            source: root.sourceRangeDate.getValue().map(item => formatDate(item, formatGetter(), locale)),
            isCompare: root.getIsCompare(),
            target: newVal
        });
    }, []);

    return {
        root,
        onSetSourcePresetTrying,
        onCancelSourcePresetTrying,
        onSetSourcePreset,
        onSetTargetPresetTrying,
        onCancelTargetPresetTrying,
        onSetTargetPreset
    };
}
