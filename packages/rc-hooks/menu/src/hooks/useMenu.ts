/**
 * @file useMenu
 */
import {useContext} from 'react';
import {Menu} from '@co-hooks/menu';
import {MenuContext} from '../context/Menu';

export function useMenu<P>(): Menu<P> {
    const menu = useContext(MenuContext);

    if (menu == null) {
        throw new Error('useMenu must be under RcMenu');
    }

    return menu;
}
