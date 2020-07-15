/**
 * @file cascader
 */

import React from 'react';
import {ICascader} from '@co-hooks/tree';

export const CascaderContext = React.createContext<ICascader<any, any> | null>(null);
