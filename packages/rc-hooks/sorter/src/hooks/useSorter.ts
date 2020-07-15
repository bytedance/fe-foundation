/**
 * @file useSorter 获取Sorter对象
 */
import {useContext} from 'react';
import {Sorter} from '@co-hooks/sorter';
import {SorterContext} from '../context/sorter';

export function useSorter<T, E>(): Sorter<T, E> {

    const sorter = useContext(SorterContext);

    if (sorter == null) {
        throw new Error('useSorter must be use under SorterProvider');
    }

    return sorter;
}
