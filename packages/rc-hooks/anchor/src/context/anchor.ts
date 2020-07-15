/**
 * @file anchor
 */
import {createContext} from 'react';
import {Anchor} from '@co-hooks/anchor';

export const AnchorContext = createContext<Anchor | null>(null);
