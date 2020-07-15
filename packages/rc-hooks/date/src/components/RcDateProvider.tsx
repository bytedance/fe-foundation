/**
 * @file RcSimpleDate 单个日期框
 */

import React, {ReactNode} from 'react';
import {IPanelRoot} from '@co-hooks/date';
import {DateContext} from '../context/date';

export interface IRcDateProviderProps {
    root: IPanelRoot;
    children?: ReactNode;
}

export function RcDateProvider(props: IRcDateProviderProps): JSX.Element {

    const {root, children} = props;

    return (
        <DateContext.Provider value={root}>
            {children}
        </DateContext.Provider>
    );
}
