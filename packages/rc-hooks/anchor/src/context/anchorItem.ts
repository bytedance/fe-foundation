/**
 * @file anchor
 */
import {createContext} from 'react';
import {AnchorItem} from '@co-hooks/anchor';

export const AnchorItemContext = createContext<AnchorItem | null>(null);
