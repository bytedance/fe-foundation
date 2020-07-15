/**
 * @file useCascaderDatasource
 */
import {useCallback, useMemo, useRef} from 'react';
import {useRefCallback} from '@rc-hooks/use';
import {ICascaderData} from '@co-hooks/cascader';
import {IDatasourceHashMap, createDatasource} from './useCascaderDatasource';

export interface IUseMultipleCascaderDatasourceResult<T, D extends ICascaderData<string>> {
    value: string[];
    datasource: D[];
    onChange: (value: string[]) => void;
}

export function useMultipleCascaderDatasource<T, D extends ICascaderData<T>>(
    value: T[][],
    datasource: D[],
    onChange: (value: T[][]) => void
): IUseMultipleCascaderDatasourceResult<T, ICascaderData<string>> {
    const hashMap = useRef<IDatasourceHashMap<T>>({});
    const data = useMemo(() => {
        hashMap.current = {};
        return createDatasource(datasource, [], hashMap.current);
    }, [datasource]);
    const onChangeCallback = useRefCallback(onChange);

    const handleChange = useCallback((value: string[]) => {
        const newVal = value.map(val => hashMap.current[val]);
        onChangeCallback(newVal);
    }, []);

    const newVal: string[] = [];
    const stringVal = value.map(item => item.join(','));

    Object.keys(hashMap.current).forEach(id => {
        if (stringVal.indexOf(hashMap.current[id].join(',')) >= 0) {
            newVal.push(id);
        }
    });

    return {
        value: newVal,
        datasource: data,
        onChange: handleChange
    };
}
