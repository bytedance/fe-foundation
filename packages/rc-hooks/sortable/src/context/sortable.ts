/**
 * @file sortable
 */

import React from 'react';
import {Sortable} from '@co-hooks/sortable';

export const SortableContext = React.createContext<Sortable<any> | null>(null);
