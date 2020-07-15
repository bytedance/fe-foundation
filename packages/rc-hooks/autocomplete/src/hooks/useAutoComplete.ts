/**
 * @file useAutoComplete
 */

import {useContext} from 'react';
import {AutoComplete} from '@co-hooks/autocomplete';
import {AutoCompleteContext} from '../context/auto-complete';

export function useAutoComplete<T>(): AutoComplete<T> {
    const autoComplete = useContext(AutoCompleteContext);

    if (autoComplete == null) {
        throw new Error('useAutoComplete must be use under RcAutoComplete');
    }

    return autoComplete;
}
