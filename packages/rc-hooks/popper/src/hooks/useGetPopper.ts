/**
 * @file useGetPopper
 */

import {useContext} from 'react';
import {Popper} from '@co-hooks/popper';
import {PopperContext} from '../context/Popper';

export function useGetPopper<T>(): Popper<T> {

    const {popper} = useContext(PopperContext);

    if (popper == null) {
        throw new Error('popperContext is not in RcPopper');
    }

    return popper as Popper<T>;
}
