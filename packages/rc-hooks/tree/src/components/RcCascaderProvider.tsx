/**
 * @file RcCascaderProvider
 */

import React from 'react';
import {Cascader} from '@co-hooks/tree';
import {CascaderContext} from '../context/cascader';

export interface IRcCascaderProviderProps<T, P> {
    cascader: Cascader<T, P>;
    children?: React.ReactNode;
}

export function RcCascaderProvider<T, P>(props: IRcCascaderProviderProps<T, P>): JSX.Element {

    const {children, cascader} = props;

    return (
        <CascaderContext.Provider value={cascader}>
            {children}
        </CascaderContext.Provider>
    );
}
