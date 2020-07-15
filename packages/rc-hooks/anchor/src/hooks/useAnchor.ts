/**
 * @file useAnchor
 */
import {useContext} from 'react';
import {Anchor} from '@co-hooks/anchor';
import {AnchorContext} from '../context/anchor';

export function useAnchor(): Anchor {
    const anchor = useContext(AnchorContext);

    if (anchor == null) {
        throw new Error('useAnchor must under RcAnchor');
    }

    return anchor;
}
