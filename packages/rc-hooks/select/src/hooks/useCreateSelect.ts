/**
 * @file useCreateSelect
 */

import {useCallback, useEffect} from 'react';
import {useRefCallback, useRefGetter, useSingleton, useUpdate} from '@rc-hooks/use';
import {ISelectDisplayInfoItem, ISelectOptions, Select} from '@co-hooks/select';

export interface ISelect<T, P> extends ISelectOptions<T, P> {
    autoClearSearchValue?: boolean;
    onChange: (value: T[], info: Array<ISelectDisplayInfoItem<T>>) => void;
}

export interface IUseCreateSelectResult<T, P> {
    select: Select<T, P>;
}

export function useCreateSelect<T, P>(options: ISelect<T, P>): IUseCreateSelectResult<T, P> {
    const {
        onChange,
        autoClearSearchValue = false,
        ...extra
    } = options;
    const select = useSingleton(() => new Select(extra));
    const onChangeCallback = useRefCallback(onChange);
    const autoClearSearchValueGetter = useRefGetter(autoClearSearchValue);
    const update = useUpdate();

    select.updateSelectOptions(extra);

    const handleChange = useCallback((value: T[], info: Array<ISelectDisplayInfoItem<T>>) => {
        onChangeCallback(value, info);

        if (autoClearSearchValueGetter()) {
            select.setQuery('');
        }
    }, []);

    useEffect(() => {
        select.addListener('value-change', handleChange);
        select.addListener('select-label-update', update);

        return () => {
            select.removeListener('value-change', handleChange);
            select.removeListener('select-label-update', update);
            select.dispose();
        };
    }, []);

    useEffect(() => {
        select.commit();
    });

    return {
        select
    };
}
