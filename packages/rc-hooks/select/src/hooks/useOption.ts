/**
 * @file useOption
 */
import {useEffect} from 'react';
import {useRefCallback, useSingleton, useUpdate} from '@rc-hooks/use';
import {IOptionData, IQueryItems, Option} from '@co-hooks/select';
import {useSelect} from './useSelect';
import {useOptionGroup} from './useOptionGroup';

export type SearchQueryEvent<T> = (optionMap: IQueryItems<T>) => void;

export type BackFillUpdateEvent = (backFill: string) => void;

export function useOption<T, P>(
    data: IOptionData<T>,
    id?: string,
    onSearchQuery?: SearchQueryEvent<T>,
    onBackFillUpdate?: BackFillUpdateEvent
): Option<T, P> {
    const select = useSelect<T, P>();
    const optionGroup = useOptionGroup<T, P>();
    const option = useSingleton(() => new Option<T, P>(
        select,
        data,
        id,
        optionGroup || undefined
    ));
    const update = useUpdate();

    option.updateOption(data);

    const onSearchQueryCallback = useRefCallback(onSearchQuery);
    const onBackFillUpdateCallback = useRefCallback(onBackFillUpdate);

    useEffect(() => {
        option.addListener('state-updated', update);
        select.addListener('search-query', onSearchQueryCallback);
        select.addListener('back-fill-update', onBackFillUpdateCallback);

        return () => {
            option.removeListener('state-updated', update);
            select.removeListener('search-query', onSearchQueryCallback);
            select.removeListener('back-fill-update', onBackFillUpdateCallback);
            option.dispose();
        };
    }, []);

    return option;
}
