/**
 * @file useParentAnchorItem
 */
import {useContext} from 'react';
import {AnchorItem} from '@co-hooks/anchor';
import {AnchorItemContext} from '../context/anchorItem';

export function useParentAnchorItem(): AnchorItem | null {
    return useContext(AnchorItemContext);
}
