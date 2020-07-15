/**
 * @file OptionGroup
 */

import React from 'react';
import {OptionGroup} from '@co-hooks/select';

export const OptionGroupContext = React.createContext<OptionGroup<any, any> | null>(null);
