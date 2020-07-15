/**
 * @file useRangeDate
 */

import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {useCallback, useEffect, useMemo} from 'react';
import {IDateLocale, formatDate, formatDateArr, parseDateArr} from '@co-hooks/util';
import {
    AddStartValue,
    IBaseDateOptions,
    ISetPanelDateEventParams,
    PanelType,
    RangeDate,
    RangePanelUpdater,
    SetPanelDate
} from '@co-hooks/date';
import {DatePresetEvent, IDatePresetItem} from './useSimpleDate';

export type RangeDateChange = (value: string[]) => void;

export interface IRangeDateOptions extends IBaseDateOptions {
    locale: IDateLocale;
    format?: string;
    offset?: number;
    value?: string[];
    onChange?: RangeDateChange;
    onUpdatePanelDate: RangePanelUpdater;
    onSetPanelDate?: SetPanelDate;
    onAddStartValue?: AddStartValue;
    panelType: PanelType;
    parts: string[];
    presets?: IDatePresetItem[];
}

export interface IUseRangeDateResult {
    root: RangeDate;
    onSetPresetTrying: DatePresetEvent;
    onCancelPresetTrying: DatePresetEvent;
    onSetPreset: DatePresetEvent;
}

export function useRangeDate(options: IRangeDateOptions): IUseRangeDateResult {

    const {
        value = [],
        format,
        locale,
        onChange,
        onUpdatePanelDate,
        onSetPanelDate,
        onAddStartValue,
        panelType,
        parts,
        ...extra
    } = options;

    const root = useMemo(() => {

        const rd = new RangeDate(panelType);

        parts.forEach(part => {
            rd.createPanel(panelType, part);
        });

        return rd;
    }, []);

    const onChangeCallback = useRefCallback(onChange);
    const onSetPanelDateCallback = useRefCallback(onSetPanelDate);
    const onAddStartValueCallback = useRefCallback(onAddStartValue);
    const formatGetter = useRefGetter(format == null ? locale.defaultFormat[panelType] : format);

    const dateList: Date[] = parseDateArr(value, formatGetter(), locale, panelType === PanelType.DATE);

    root.updateOptions(extra);
    root.setRangePanelUpdate(onUpdatePanelDate);
    root.updateValue(dateList.length >= 2 ? dateList : []);

    useEffect(() => {

        const callback = (dateList: Date[]): void => {
            onChangeCallback(dateList.map(item => formatDate(item, formatGetter(), locale)));
        };

        const setPanelDateCallback = (params: ISetPanelDateEventParams): void => {
            onSetPanelDateCallback(root, params);
        };

        const addStartValueCallback = (date: Date): void => {
            onAddStartValueCallback(root, date);
        };

        root.addListener('value-change', callback);
        root.addListener('set-panel-date', setPanelDateCallback);
        root.addListener('add-start-value', addStartValueCallback);

        return () => {
            root.removeListener('value-change', callback);
            root.removeListener('set-panel-date', setPanelDateCallback);
            root.removeListener('add-start-value', addStartValueCallback);
        };
    }, []);

    const onSetPresetTrying = useCallback((preset: IDatePresetItem) => {
        if (!preset.value.length) {
            return;
        }

        const newVal: Date[] = parseDateArr(preset.value, formatGetter(), locale, panelType === PanelType.DATE);

        root.setPresetTrying(newVal.length >= 2 ? newVal : []);

    }, []);

    const onCancelPresetTrying = useCallback(() => {
        root.resetPresetTrying();
    }, []);

    const onSetPreset = useCallback((preset: IDatePresetItem) => {
        const newVal = formatDateArr(preset.value, formatGetter(), locale);
        onChangeCallback(newVal);
    }, []);

    return {
        root,
        onSetPresetTrying,
        onCancelPresetTrying,
        onSetPreset
    };
}
