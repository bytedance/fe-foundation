/**
 * @file useSelect
 */
import {useContext} from 'react';
import {Select} from '@co-hooks/select';
import {SelectContext} from '../context/select';

export function useSelect<T, P>(): Select<T, P> {
    const select = useContext(SelectContext);

    if (select == null) {
        throw new Error('useSelect must be use under RcSelect');
    }

    return select;
}
