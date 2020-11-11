/**
 * @file useContextMenu
 */

import {RefObject, useEffect} from 'react';
import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {useContainer} from '@rc-hooks/dom';

export type ContextMenuHandler = (e: MouseEvent) => void;

export function useContextMenu(
    element: HTMLElement | null | RefObject<HTMLElement>,
    enable: () => boolean,
    onContextMenu: ContextMenuHandler
): void {

    const onContextMenuCallback = useRefCallback(onContextMenu);
    const elementGetter = useContainer(element);
    const enableGetter = useRefGetter(enable);

    useEffect(() => {
        if (!enableGetter()()) {
            return;
        }

        const elem = elementGetter();

        if (!elem) {
            return;
        }

        const handleContextMenu = (e: MouseEvent): void | false => {
            onContextMenuCallback(e);
            e.preventDefault();
            return false;
        };

        elem.addEventListener('contextmenu', handleContextMenu);

        return () => {
            elem.removeEventListener('contextmenu', handleContextMenu);
        };

    }, [enableGetter()()]);
}
