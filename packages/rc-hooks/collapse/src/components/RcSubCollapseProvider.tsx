/**
 * @file RcSubCollapseProvider
 */
import {SubCollapse} from '@co-hooks/collapse';
import React, {ReactNode} from 'react';
import {SubCollapseContext} from '../context/subCollapse';

export interface IRcSubCollapseProviderProps {
    subCollapse: SubCollapse;
    children: ReactNode;
}

export function RcSubCollapseProvider(props: IRcSubCollapseProviderProps): JSX.Element {
    const {subCollapse, children} = props;

    return (
        <SubCollapseContext.Provider value={subCollapse}>
            {children}
        </SubCollapseContext.Provider>
    );
}
