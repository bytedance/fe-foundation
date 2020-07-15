/**
 * @file autoComplete
 */

import React from 'react';
import {AutoComplete} from '@co-hooks/autocomplete';

export const AutoCompleteContext = React.createContext<AutoComplete<any> | null>(null);
