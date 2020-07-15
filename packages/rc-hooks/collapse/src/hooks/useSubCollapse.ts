/**
 * @file useSubCollapse 获取折叠的操作对象
 */

import {useContext} from 'react';
import {SubCollapse} from '@co-hooks/collapse';
import {SubCollapseContext} from "../context/subCollapse";

export function useSubCollapse(): SubCollapse | null {

    return useContext<SubCollapse | null>(SubCollapseContext);
}
