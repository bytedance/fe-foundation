/**
 * @file useCascaderDatasource
 */
import {useCallback, useMemo, useRef} from 'react';
import {useRefCallback} from '@rc-hooks/use';
import {ICascaderDatasource} from '@co-hooks/tree';
import {IDatasourceHashMap, createDatasource} from './useCascaderDatasource';

export interface IUseMultipleCascaderDatasourceResult<T, P> {
    value: string[];
    datasource: Array<ICascaderDatasource<string, P>>;
    onChange: (value: string[]) => void;
}

export function useMultipleCascaderDatasource<T, P>(
    value: T[][],
    datasource: Array<ICascaderDatasource<T, P>>,
    onChange: (value: T[][]) => void
): IUseMultipleCascaderDatasourceResult<T, P> {
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
