/**
 * @file template
 */

import {createContext} from 'react';
import {EditorTemplate} from '@chief-editor/core';

export const TemplateContext = createContext<EditorTemplate | null>(null);
