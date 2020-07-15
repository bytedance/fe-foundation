/**
 * @file useShallowState 带shallow equal的状态
 */
import {shallowEqual} from '@co-hooks/util';
import {Dispatch, SetStateAction, useCallback, useState} from 'react';

export function useShallowState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>] {

    const [state, setState] = useState<S>(initialState);

    const setShallowState = useCallback((action: SetStateAction<S>) => {

        setState(prevState => {

            let value: S;

            if (typeof action === 'function') {
                value = (action as (prevState: S) => S)(prevState);
            } else {
                value = action;
            }

            return shallowEqual(prevState, value) ? prevState : value;
        });
    }, []);

    return [state, setShallowState];
}
