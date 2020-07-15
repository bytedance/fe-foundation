/**
 * @file schedule
 */

import {createContext} from 'react';
import {Schedule} from '@co-hooks/schedule';

export const ScheduleContext = createContext<Schedule | null>(null);
