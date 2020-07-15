/**
 * @file region Region上下文
 */

import React from 'react';
import {IRegion} from '@co-hooks/region';

export const RegionContext = React.createContext<IRegion | null>(null);
