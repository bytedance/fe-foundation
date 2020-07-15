/**
 * @file useMultipleDate
 */

import {useRefCallback, useRefGetter, useSingleton} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {IDateLocale, formatDate, formatDateArr, parseDateArr} from '@co-hooks/util';
import {
    IBaseDateOptions,
    ISetPanelDateEventParams,
    MultipleDate,
    MultiplePanelUpdater,
    PanelType,
    SetMultiplePanelDate
} from '@co-hooks/date';
import {DatePresetEvent, IDatePresetItem} from './useSimpleDate';

export type MultipleDateChange = (value: string[]) => void;

export interface IMultipleDateOptions extends IBaseDateOptions {
    locale: IDateLocale;
    format?: string;
    offset?: number;
    value?: string[];
    onChange?: MultipleDateChange;
    onUpdatePanelDate: MultiplePanelUpdater;
    onSetPanelDate?: SetMultiplePanelDate;
    panelType: PanelType;
    parts: string[];
    presets?: IDatePresetItem[];
}

export interface IUseMultipleDateResult {
    root: MultipleDate;
    onSetPresetTrying: DatePresetEvent;
    onCancelPresetTrying: DatePresetEvent;
    onSetPreset: DatePresetEvent;
}

export function useMultipleDate(options: IMultipleDateOptions): IUseMultipleDateResult {

    const {
        value = [],
        format,
        locale,
        onChange,
        onUpdatePanelDate,
        onSetPanelDate,
        panelType,
        parts,
        ...extra
    } = options;

    const root = useSingleton(() => {

        const rd = new MultipleDate(panelType);

        parts.forEach(part => {
            rd.createPanel(panelType, part);
        });

        return rd;
    });

    const onChangeCallback = useRefCallback(onChange);
    const onSetPanelDateCallback = useRefCallback(onSetPanelDate);
    const formatGetter = useRefGetter(format == null ? locale.defaultFormat[panelType] : format);

    const dateList: Date[] = parseDateArr(value, formatGetter(), locale, panelType === PanelType.DATE);

    root.updateOptions(extra);
    root.setMultiplePanelUpdate(onUpdatePanelDate);
    root.updateValue(dateList);

    useEffect(() => {

        const callback = (dateList: Date[]): void => {
            onChangeCallback(dateList.map(item => formatDate(item, formatGetter(), locale)));
        };

        const setPanelDateCallback = (params: ISetPanelDateEventParams): void => {
            onSetPanelDateCallback(root, params);
        };

        root.addListener('value-change', callback);
        root.addListener('set-panel-date', setPanelDateCallback);

        return () => {
            root.removeListener('value-change', callback);
            root.removeListener('set-panel-date', setPanelDateCallback);
        };
    }, []);

    const onSetPresetTrying = useCallback((preset: IDatePresetItem) => {

        if (!preset.value.length) {
            return;
        }

        const newVal: Date[] = parseDateArr(preset.value, formatGetter(), locale, panelType === PanelType.DATE);

        root.setPresetTrying(newVal);

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
