/**
 * @file useOptionalState
 */

import {useCallback, useState} from 'react';

export function useOptionalState<S>(
    initialValue: S | (() => S) | undefined,
    emptyValue: S
): [S, (value: S | undefined) => void];
export function useOptionalState<S>(
    initialValue: S | (() => S) | undefined
): [S | undefined, (value: S | undefined) => void];
export function useOptionalState<S>(
    initialValue?: S | (() => S),
    emptyValue?: S
): [S | undefined, (value: S | undefined) => void] {

    const [value, setValue] = useState<S | undefined>(initialValue);

    const onChange = useCallback((value?: S) => setValue(value), []);

    return [value, onChange];
}
