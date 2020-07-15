/**
 * @file RangeTimeContext 时间段上下文
 */

import {createContext} from 'react';
import {RangeTime} from '@co-hooks/date';

export const RangeTimeContext = createContext<RangeTime | null>(null);
