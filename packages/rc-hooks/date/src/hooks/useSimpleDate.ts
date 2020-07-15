/**
 * @file useSimpleDate 生成单日期数据流
 */

import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {useCallback, useEffect, useMemo} from 'react';
import {IDateLocale, formatDate, parseDate} from '@co-hooks/util';
import {IBaseDateOptions, PanelType, SimpleDate, SimplePanelUpdater} from '@co-hooks/date';

export interface IDatePresetItem {
    label: string;
    key: string;
    value: Array<Date | string>;
}

export type SimpleDateChange = (value: string) => void;

export type DatePresetEvent = (presetItem: IDatePresetItem) => void;

export interface IUseSimpleDateResult {
    root: SimpleDate;
    onSetPresetTrying: DatePresetEvent;
    onCancelPresetTrying: DatePresetEvent;
    onSetPreset: DatePresetEvent;
}

export interface ISimpleDateOptions extends IBaseDateOptions {
    value: string;
    panelType: PanelType;
    parts: string[];
    format?: string;
    locale: IDateLocale;
    onUpdatePanelDate: SimplePanelUpdater;
    onChange?: SimpleDateChange;
}

export function useSimpleDate(options: ISimpleDateOptions): IUseSimpleDateResult {

    const {
        panelType,
        parts,
        value,
        format,
        onChange,
        locale,
        onUpdatePanelDate,
        ...extra
    } = options;

    const onChangeCallback = useRefCallback(onChange);
    const formatGetter = useRefGetter(format == null ? locale.defaultFormat[panelType] : format);
    const root = useMemo(() => {

        const date = new SimpleDate(panelType);

        parts.forEach(key => {
            date.createPanel(panelType, key);
        });

        return date;
    }, []);

    let date = parseDate(value, formatGetter(), locale, panelType === PanelType.DATE);

    root.updateOptions(extra);
    root.setSimplePanelUpdate(onUpdatePanelDate);
    root.updateValue(date);

    useEffect(() => {

        const callback = (date: Date): void => {
            onChangeCallback(formatDate(date, formatGetter(), locale));
        };

        root.addListener('value-change', callback);

        return () => {
            root.removeListener('value-change', callback);
        };
    }, []);

    const onSetPresetTrying = useCallback((preset: IDatePresetItem) => {

        if (!preset.value.length) {
            return;
        }

        const val = preset.value[0];
        const newVal = typeof val === 'string'
            ? parseDate(val, formatGetter(), locale, panelType === PanelType.DATE)
            : val;

        if (newVal == null) {
            return;
        }

        root.setPresetTrying(newVal);

    }, []);

    const onCancelPresetTrying = useCallback(() => {
        root.resetPresetTrying();
    }, []);

    const onSetPreset = useCallback((preset: IDatePresetItem) => {
        if (!preset.value.length) {
            return;
        }

        let newVal = '';

        const val = preset.value[0];
        if (typeof val !== 'string') {
            newVal = formatDate(val, formatGetter(), locale);
        } else {
            newVal = val;
        }

        onChangeCallback(newVal);
    }, []);

    return {
        root,
        onSetPresetTrying,
        onCancelPresetTrying,
        onSetPreset
    };
}
