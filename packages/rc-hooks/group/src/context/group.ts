/**
 * @file group
 */

import React from 'react';
import {Group} from '@co-hooks/group';

export const GroupContext = React.createContext<Group<any, any> | null>(null);
