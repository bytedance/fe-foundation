/**
 * @file Option
 */

import React from 'react';
import {Option} from '@co-hooks/select';

export const OptionContext = React.createContext<Option<any, any> | null>(null);
