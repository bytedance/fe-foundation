/**
 * @file SelectContext
 */

import React from 'react';
import {Select} from '@co-hooks/select';

export const SelectContext = React.createContext<Select<any, any> | null>(null);
