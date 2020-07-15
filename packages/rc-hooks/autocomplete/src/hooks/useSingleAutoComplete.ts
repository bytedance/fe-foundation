/**
 * @file useAutoCompleteOption
 */
import {useCallback, useEffect} from 'react';
import {AutoComplete, IAutoCompleteOptions} from '@co-hooks/autocomplete';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {deepEqual, isPlainObject} from '@co-hooks/util';

export type IAutoCompleteBase<T> = Omit<
IAutoCompleteOptions<T>,
'keyword' | 'selectedValue' | 'multiple'
> & {
    onSearch?: (keyword: string) => void;
};

export type ISingleAutoComplete<T> = IAutoCompleteBase<T> & {
    value?: T;
    onHide: VoidFunction;
    onSelect?: (value: T) => void;
    onChange?: (value: T | string) => void;
};

export function useSingleAutoComplete<T>(options: ISingleAutoComplete<T>): AutoComplete<T> {
    const {onHide, onSearch, onChange, onSelect, value, dataSource, ...extra} = options;
    const root = useSingleton(() => new AutoComplete<T>());

    const handleSearch = useRefCallback((v: string) => {
        onSearch && onSearch(v);
        onChange && onChange(v);
    });

    const handleSelect = useRefCallback((value: T[]) => {
        onSelect && onSelect(value[0]);
        onChange && onChange(value[0] || '');
        onHide();
    });

    const getKeyword = useCallback(() => {
        let keyword = '';

        if (!isPlainObject(value) && value != null) {
            keyword = String(value);
        }

        dataSource.map(item => {
            deepEqual(item.value, value) && (keyword = item.label);
        });

        return keyword;
    }, [value, dataSource]);

    root.updateOptions({
        dataSource,
        multiple: false,
        keyword: value && getKeyword(),
        ...extra
    });

    useEffect(() => {
        root.addListener('on-select', handleSelect);
        root.addListener('on-search', handleSearch);

        return () => {
            root.removeListener('on-select', handleSelect);
            root.removeListener('on-search', handleSearch);
        };
    }, []);

    return root;
}
