/**
 * @file template
 */

import {BaseBoard, BaseTemplate} from '@chief-editor/base';
import {createContext} from 'react';
import {EditableBaseBrickGlobal} from '@chief-editor/core';

export const TemplateContext = createContext<BaseTemplate<BaseBoard, EditableBaseBrickGlobal> | null>(null);
