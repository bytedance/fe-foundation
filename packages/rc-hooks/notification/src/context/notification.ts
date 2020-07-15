/**
 * @file notification 通知上下文
 */

import React from 'react';
import {NotificationInstance} from '../lib/NotificationInstance';

export const NotificationContext = React.createContext<NotificationInstance<unknown> | null>(null);
