/**
 * @file useCascaderSearch 获取搜索结果
 */

import {throttle} from '@co-hooks/util';
import {useCallback, useState} from 'react';
import {useCascader} from './useCascader';

export function useCascaderSearch(): [string, string[], (newQuery: string) => void] {

    const [query, setQuery] = useState('');
    const cascader = useCascader();
    const updater = useCallback(throttle((newQuery: string) => cascader.setQuery(newQuery), 200), []);
    const onQueryChange = useCallback((newQuery: string) => {
        setQuery(newQuery);
        updater(newQuery);
    }, []);

    return [query, cascader.getQueries(), onQueryChange];
}
