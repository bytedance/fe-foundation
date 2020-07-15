/**
 * @file RcSubMenu
 */

import React, {useEffect} from 'react';
import {SubMenu} from '@co-hooks/menu';
import {useSingleton} from '@rc-hooks/use';
import {SubMenuContext} from '../context/SubMenu';
import {useMenu} from '../hooks/useMenu';
import {useParentSubMenu} from '../hooks/useParentSubMenu';
import {IRcSubMenuProps} from '../types';

export function RcSubMenu<P>(props: IRcSubMenuProps): JSX.Element {

    const {children, insId, ...extra} = props;
    const menu = useMenu<P>();
    const parent = useParentSubMenu<P>();
    const subMenu = useSingleton(() => new SubMenu(menu, extra, parent, insId));

    // bugfix: 不应再次触发: openIds 必须包含所有级，updateOpened会把下级也关闭
    // const opened = subMenu.getOpened();
    // useMemo(() => {
    //     if (opened) {
    //         subMenu.updateOpened(true, true); // 依次向上打开父menu
    //     }
    // }, [menu.getOpenIds()]);

    useEffect(() => () => {
        subMenu.dispose();
    }, []);

    return (
        <SubMenuContext.Provider value={subMenu}>
            {children}
        </SubMenuContext.Provider>
    );
}
