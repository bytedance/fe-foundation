/**
 * @file runtime 运行时Brick分发Context
 */
import React from 'react';
import {IRuntimeContext} from '../types';

export const RuntimeContext = React.createContext<IRuntimeContext | null>(null);
