/**
 * @file RcMenu
 */
import React, {useEffect} from 'react';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {Menu} from '@co-hooks/menu';
import {MenuContext} from '../context/Menu';
import {IRcMenuProps} from '../types';

export function RcMenu<P>(props: IRcMenuProps<P>): JSX.Element {
    const {children, onClick, onOpenChange, ...extra} = props;
    const menu = useSingleton(() => new Menu<P>(extra));
    const handleClick = useRefCallback(onClick);
    const handleOpenChange = useRefCallback(onOpenChange);

    menu.updateMenuOptions(extra);

    useEffect(() => {
        menu.addListener('active-item-change', handleClick);
        menu.addListener('open-menus-change', handleOpenChange);

        return () => {
            menu.removeListener('active-item-change', handleClick);
            menu.removeListener('open-menus-change', handleOpenChange);
        };
    }, []);


    return (
        <MenuContext.Provider value={menu}>
            {children}
        </MenuContext.Provider>
    );
}
