/**
 * @file useParentSubMenu
 */
import {useContext} from 'react';
import {SubMenu} from '@co-hooks/menu';
import {SubMenuContext} from '../context/SubMenu';

export function useParentSubMenu<P>(): SubMenu<P> | null {
    return useContext(SubMenuContext);
}
