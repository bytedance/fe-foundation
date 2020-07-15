/**
 * @file usePrevProp 保存之前的属性
 */

import {useContext, useEffect, useMemo} from 'react';
import {useUpdate} from '@rc-hooks/use';
import {SubMenu} from '@co-hooks/menu';
import {SubMenuContext} from '../context/SubMenu';
import {useMenu} from './useMenu';

export function useSubMenu<P>(): SubMenu<P> | null {
    const update = useUpdate();
    const menu = useMenu();

    useMemo(() => {
        menu.addListener('active-menus-update', update);
        menu.addListener('open-menus-update', update);
    }, []);
    useEffect(() => () => {
        menu.removeListener('active-menus-update', update);
        menu.removeListener('open-menus-update', update);
    }, []);

    return useContext(SubMenuContext);
}
