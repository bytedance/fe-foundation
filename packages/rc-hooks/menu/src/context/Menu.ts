/**
 * @file MenuContext
 */

import React from 'react';
import {Menu} from '@co-hooks/menu';

export const MenuContext = React.createContext<Menu<any> | null>(null);
