/**
 * @file time 时间上下文
 */

import {createContext} from 'react';
import {Time} from '@co-hooks/date';

export const TimeContext = createContext<Time | null>(null);
