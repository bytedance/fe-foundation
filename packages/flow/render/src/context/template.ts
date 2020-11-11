/**
 * @file template
 */

import {FlowTemplate} from '@chief-editor/flow';
import {createContext} from 'react';

export const TemplateContext = createContext<FlowTemplate | null>(null);
