/**
 * @file hotkey
 */

import React from 'react';
import {HotKey} from '@co-hooks/hotkey';

export const HotKeyContext = React.createContext<HotKey | null>(null);
