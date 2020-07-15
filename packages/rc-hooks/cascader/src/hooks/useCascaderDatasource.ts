/**
 * @file useCascaderDatasource
 */
import {useCallback, useMemo, useRef} from 'react';
import {guid, shallowEqual} from '@co-hooks/util';
import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {ICascaderData} from '@co-hooks/cascader';

export interface IDatasourceHashMap<T> {
    [key: string]: T[];
}

export interface IUseCascaderDatasourceResult<T, D extends ICascaderData<string>> {
    value?: string;
    datasource: D[];
    onChange: (value?: string) => void;
}

export function useCascaderDatasource<T, D extends ICascaderData<T>>(
    value: T[],
    datasource: D[],
    onChange: (value: T[]) => void
): IUseCascaderDatasourceResult<T, ICascaderData<string>> {
    const hashMap = useRef<IDatasourceHashMap<T>>({});
    const data = useMemo(() => {
        hashMap.current = {};
        return createDatasource(datasource, [], hashMap.current);
    }, [datasource]);
    const onChangeCallback = useRefCallback(onChange);
    const valueGetter = useRefGetter(value);

    const handleChange = useCallback((value?: string) => {

        const newVal = value == null ? [] : hashMap.current[value] || [];
        const ov = valueGetter();

        if (!shallowEqual(newVal, ov)) {
            onChangeCallback(newVal);
        }
    }, []);

    let newVal;
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

export function createDatasource<T, D extends ICascaderData<T>>(
    datasource: D[],
    rootValue: T[] = [],
    hashMap: IDatasourceHashMap<T>
): Array<ICascaderData<string>> {
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
