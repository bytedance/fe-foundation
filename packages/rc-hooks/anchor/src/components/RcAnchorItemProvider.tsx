/**
 * @file RcAnchorProvider
 */
import React, {ReactNode} from 'react';
import {AnchorItem} from '@co-hooks/anchor';
import {AnchorItemContext} from '../context/anchorItem';

export interface IRcAnchorItem {
    anchorItem: AnchorItem;
    children: ReactNode;
}

export function RcAnchorItemProvider(props: IRcAnchorItem): JSX.Element {
    const {anchorItem, children} = props;

    return (
        <AnchorItemContext.Provider value={anchorItem}>
            {children}
        </AnchorItemContext.Provider>
    );
}
