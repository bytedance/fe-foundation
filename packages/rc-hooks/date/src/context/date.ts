/**
 * @file date 日期上下文
 */

import {createContext} from 'react';
import {IPanelRoot} from '@co-hooks/date';

export const DateContext = createContext<IPanelRoot | null>(null);
