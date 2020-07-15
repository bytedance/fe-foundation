/**
 * @file RcAutoComplete
 */
import React, {PropsWithChildren} from 'react';
import {AutoComplete} from '@co-hooks/autocomplete';
import {AutoCompleteContext} from '../context/auto-complete';

export type IAutoCompleteProviderProps<T> = PropsWithChildren<{
    root: AutoComplete<T>;
}>;

export function RcAutoCompleteProvider<T>(
    props: IAutoCompleteProviderProps<T>
): JSX.Element {
    const {children, root} = props;

    return (
        <AutoCompleteContext.Provider value={root}>
            {children}
        </AutoCompleteContext.Provider>
    );
}
