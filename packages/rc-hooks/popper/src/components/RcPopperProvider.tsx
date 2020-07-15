/**
 * @file RcPopperProvider
 */

import React, {ReactNode} from 'react';
import {Popper} from '@co-hooks/popper';
import {PopperContext} from '../context/Popper';

export interface IRcPopperProvider<T> {
    popper: Popper<T>;
    children?: ReactNode;
}

export type IRcPopperProviderProps<T> = IRcPopperProvider<T>;

export function RcPopperProvider<T>(props: IRcPopperProviderProps<T>): JSX.Element {
    const {popper, children} = props;

    return (
        <PopperContext.Provider value={{popper}}>
            {children}
        </PopperContext.Provider>
    );
}
