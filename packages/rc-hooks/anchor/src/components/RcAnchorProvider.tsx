/**
 * @file RcAnchorProvider
 */
import React, {ReactNode} from 'react';
import {Anchor} from '@co-hooks/anchor';
import {AnchorContext} from '../context/anchor';

export interface IRcAnchor {
    anchor: Anchor;
    children: ReactNode;
}

export function RcAnchorProvider(props: IRcAnchor): JSX.Element {
    const {anchor, children} = props;

    return (
        <AnchorContext.Provider value={anchor}>
            {children}
        </AnchorContext.Provider>
    );
}
