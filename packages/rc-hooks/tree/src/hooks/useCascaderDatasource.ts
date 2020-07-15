/**
 * @file useCascaderDatasource
 */
import {useCallback, useMemo, useRef} from 'react';
import {guid} from '@co-hooks/util';
import {useRefCallback} from '@rc-hooks/use';
import {ICascaderDatasource} from '@co-hooks/tree';

export interface IDatasourceHashMap<T> {
    [key: string]: T[];
}

export interface IUseCascaderDatasourceResult<T, P> {
    value: string;
    datasource: Array<ICascaderDatasource<string, P>>;
    onChange: (value?: string) => void;
}

export function useCascaderDatasource<T, P>(
    value: T[],
    datasource: Array<ICascaderDatasource<T, P>>,
    onChange: (value: T[]) => void
): IUseCascaderDatasourceResult<T, P> {
    const hashMap = useRef<IDatasourceHashMap<T>>({});
    const data = useMemo(() => {
        hashMap.current = {};
        return createDatasource(datasource, [], hashMap.current);
    }, [datasource]);
    const onChangeCallback = useRefCallback(onChange);

    const handleChange = useCallback((value?: string) => {

        if (!value) {
            onChangeCallback([]);
            return;
        }

        const newVal = hashMap.current[value] || [];
        onChangeCallback(newVal);
    }, []);

    let newVal = '';
    Object.keys(hashMap.current).some(id => {
        if (hashMap.current[id].join(',') === value.join(',')) {
            newVal = id;
            return true;
        }
    });

    return {
        value: newVal,
        datasource: data,
        onChange: handleChange
    };
}

export function createDatasource<T, P>(
    datasource: Array<ICascaderDatasource<T, P>>,
    rootValue: T[] = [],
    hashMap: IDatasourceHashMap<T>
): Array<ICascaderDatasource<string, P>> {
    return datasource.map(item => {
        const values = rootValue.slice().concat(item.value);
        const id = guid();

        hashMap[id] = values;
        return {
            ...item,
            value: id,
            children: createDatasource(item.children || [], values, hashMap)
        };
    });
}
