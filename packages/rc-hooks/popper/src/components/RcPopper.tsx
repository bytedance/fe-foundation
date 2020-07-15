/**
 * @file RcPopper 弹窗
 */

import React from 'react';
import {PopperContext} from '../context/Popper';
import {usePopper} from '../hooks/usePopper';

interface IRcPopper {
    children?: React.ReactNode;
}

export type IRcPopperProps = IRcPopper;

export function RcPopper(props: IRcPopperProps): JSX.Element {

    const {children} = props;

    const {popper} = usePopper();

    return (
        <PopperContext.Provider value={{popper}}>
            {children}
        </PopperContext.Provider>
    );
}
