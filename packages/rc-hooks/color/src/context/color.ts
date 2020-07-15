/**
 * @file color 上下文
 */

import {createContext} from 'react';
import {ColorManager} from '@co-hooks/color';

export const ColorContext = createContext<ColorManager | null>(null);
