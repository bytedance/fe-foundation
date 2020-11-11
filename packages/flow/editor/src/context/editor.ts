/**
 * @file EditorContext
 */

import React from 'react';
import {Editor} from '@chief-editor/core';


export const EditorContext = React.createContext<Editor | null>(null);
