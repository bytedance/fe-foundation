/**
 * @file RcCompareRangeDateProvider
 */

import React, {ReactNode} from 'react';
import {CompareRangeDate} from '@co-hooks/date';
import {CompareRangeDateContext} from '../context/compare';

export interface IRcCompareRangeDateProviderProps {
    root: CompareRangeDate;
    children?: ReactNode;
}

export function RcCompareRangeDateProvider(props: IRcCompareRangeDateProviderProps): JSX.Element {

    const {root, children} = props;

    return (
        <CompareRangeDateContext.Provider value={root}>
            {children}
        </CompareRangeDateContext.Provider>
    );
}

