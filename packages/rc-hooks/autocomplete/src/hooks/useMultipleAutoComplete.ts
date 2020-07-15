/**
 * @file useMultipleAutoComplete
 */
import {useEffect} from 'react';
import {AutoComplete, IDataSourceItem} from '@co-hooks/autocomplete';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {deepEqual} from '@co-hooks/util';
import {IAutoCompleteBase} from './useSingleAutoComplete';

export type IMultipleAutoComplete<T> = IAutoCompleteBase<T> & {
    value?: T[];
    onChange?: (value: T[]) => void;
};

export function useMultipleAutoComplete<T>(options: IMultipleAutoComplete<T>): AutoComplete<T> {
    const {onSearch, onChange, value, dataSource, ...extra} = options;

    const root = useSingleton(() => new AutoComplete<T>());

    const handleSearch = useRefCallback((v: string) => {
        onSearch && onSearch(v);
    });

    const handleChange = useRefCallback((value: T[]) => {
        onChange && onChange(value);
    });

    const convertSelectedValue = (selectedValue: T[]): IDataSourceItem<T>[] =>
        selectedValue.map(value => {
            const filterLabel = dataSource.filter(item => deepEqual(item.value, value));
            const label = filterLabel.length > 0 ? filterLabel[0].label : '';
            return {label, value};
        });

    root.updateOptions({
        dataSource,
        multiple: true,
        selectedValue: value && convertSelectedValue(value),
        ...extra
    });

    useEffect(() => {
        root.addListener('on-select', handleChange);
        root.addListener('on-search', handleSearch);

        return () => {
            root.removeListener('on-select', handleChange);
            root.removeListener('on-search', handleSearch);
        };
    }, []);

    return root;
}
