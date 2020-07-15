/**
 * @file PopperContext
 */

import React from 'react';
import {Popper} from '@co-hooks/popper';

export interface IPopperContext {
    popper: Popper<unknown> | null;
}

export const PopperContext = React.createContext<IPopperContext>({
    popper: null
});
