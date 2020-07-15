/**
 * @file sorter 排序组件
 */
import {createContext} from 'react';
import {Sorter} from '@co-hooks/sorter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SorterContext = createContext<Sorter<any, any> | null>(null);

export const SorterProvider = SorterContext.Provider;
