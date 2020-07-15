/**
 * @file SubMenuContext
 */

import React from 'react';
import {SubMenu} from '@co-hooks/menu';

export const SubMenuContext = React.createContext<SubMenu<any> | null>(null);
