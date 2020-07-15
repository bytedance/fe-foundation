/**
 * @file useMenuItem
 */
import {useEffect, useState} from 'react';
import {IMenuItemOptions, MenuItem} from '@co-hooks/menu';
import {useSingleton} from '@rc-hooks/use';
import {useMenu} from './useMenu';
import {useParentSubMenu} from './useParentSubMenu';

export function useMenuItem<P>(
    options: IMenuItemOptions,
    insId?: string
): [MenuItem<P>, boolean] {

    const menu = useMenu<P>();
    const parent = useParentSubMenu<P>();
    const menuItem = useSingleton(() => new MenuItem(menu, parent, insId));

    menuItem.updateMenuItemOptions(options);

    const [active, setActive] = useState(menuItem.getActive());

    useEffect(() => {
        const handleActiveMenu = (activeId: string): void => {
            setActive(val => {
                const id = menuItem.getId();
                if (val && activeId !== id) {
                    return false;
                } else if (!val && activeId === id) {
                    return true;
                }

                return val;
            });
        };

        menu.addListener('active-item-update', handleActiveMenu);

        return () => {
            menu.removeListener('active-item-update', handleActiveMenu);
            menuItem.dispose();
        };
    }, []);

    return [menuItem, active];
}
