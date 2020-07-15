/**
 * @file useScope
 */

import {FormDomNode} from '@co-hooks/form';
import {useContext} from 'react';
import {ScopeContext} from '../context/scope';

export function useFormScope(): FormDomNode {

    const scope = useContext(ScopeContext);

    if (scope == null) {
        throw new Error('useFormScope must be use with ScopeProvider');
    }

    return scope;
}
