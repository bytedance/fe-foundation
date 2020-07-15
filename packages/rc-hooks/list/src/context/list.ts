/**
 * @file list 虚拟化上下文
 */

import React from 'react';
import {List} from '../lib/List';

export const ListContext = React.createContext<List | null>(null);
