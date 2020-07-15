/**
 * @file RcSelectProvider
 */

import React from 'react';
import {SelectContext} from '../context/select';
import {Select} from '@co-hooks/select';

export interface IRcSelectProvider<T, P> {
    select: Select<T, P>;
    children: React.ReactNode;
}

export type IRcSelectProviderProps<T, P> = IRcSelectProvider<T, P>;

export function RcSelectProvider<T, P>(props: IRcSelectProviderProps<T, P>): JSX.Element {
    const {children, select} = props;

    return (
        <SelectContext.Provider value={select}>
            {children}
        </SelectContext.Provider>
    );
}
