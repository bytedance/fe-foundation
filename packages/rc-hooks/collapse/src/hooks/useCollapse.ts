/**
 * @file useCollapse 获取折叠的操作对象
 */

import {useContext} from 'react';
import {Collapse} from '@co-hooks/collapse';
import {CollapseContext} from '../context/collapse';

export function useCollapse(): Collapse {

    const collapse = useContext<Collapse | null>(CollapseContext);

    if (collapse == null) {
        throw new Error('useCollapse must be use under RcCollapse');
    }

    return collapse;
}
