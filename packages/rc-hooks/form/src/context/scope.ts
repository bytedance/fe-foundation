/**
 * @file scope
 */

import {OptionalDomNode} from '@co-hooks/dom-node';
import {createContext} from 'react';
import {FormNode} from '@co-hooks/form';

export const ScopeContext = createContext<OptionalDomNode<FormNode>>(null);

export const ScopeProvider = ScopeContext.Provider;
