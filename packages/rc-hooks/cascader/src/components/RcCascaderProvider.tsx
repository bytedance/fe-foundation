/**
 * @file RcCascaderProvider
 */

import React from 'react';
import {Cascader} from '@co-hooks/cascader';
import {CascaderContext} from '../context/cascader';

export interface IRcCascaderProviderProps<T> {
    cascader: Cascader<T>;
    children?: React.ReactNode;
}

export function RcCascaderProvider<T>(props: IRcCascaderProviderProps<T>): JSX.Element {

    const {children, cascader} = props;

    return (
        <CascaderContext.Provider value={cascader}>
            {children}
        </CascaderContext.Provider>
    );
}
