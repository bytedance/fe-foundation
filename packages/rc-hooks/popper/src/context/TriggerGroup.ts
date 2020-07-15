/**
 * @file TriggerGroup
 */

import React from 'react';
import {TriggerGroup} from '@co-hooks/popper';

export const TriggerGroupContext = React.createContext<TriggerGroup<unknown> | null>(null);
