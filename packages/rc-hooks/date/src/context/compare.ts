/**
 * @file compareRangeDate 日期上下文
 */

import {createContext} from 'react';
import {CompareRangeDate} from '@co-hooks/date';

export const CompareRangeDateContext = createContext<CompareRangeDate | null>(null);
