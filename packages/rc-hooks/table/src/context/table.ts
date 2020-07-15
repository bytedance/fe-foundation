/**
 * @file table
 */

import {Table} from '@co-hooks/table';
import {ProviderProps, createContext} from 'react';

export const TableContext = createContext<unknown>(null);

export const TableProvider = TableContext.Provider as <T, E, K extends keyof T>(
    props: ProviderProps<Table<T, E, K>>
) => JSX.Element;
