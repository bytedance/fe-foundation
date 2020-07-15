/**
 * @file useCreateSubCollapse
 */
import {IRcSubCollapse, SubCollapse} from '@co-hooks/collapse';
import {useRefGetter, useSingleton, useUpdate} from '@rc-hooks/use';
import {useCallback, useEffect} from 'react';
import {useCollapse} from './useCollapse';
import {useSubCollapse} from './useSubCollapse';

export interface IUseCreateSubCollapseResult {
    lazy: boolean;
    isOpen: boolean;
    subCollapse: SubCollapse;
    setOpened: (open: boolean) => void;
}

export function useCreateSubCollapse(options: IRcSubCollapse, id?: string): IUseCreateSubCollapseResult {
    const root = useCollapse();
    const parent = useSubCollapse();
    const subCollapse = useSingleton(() => new SubCollapse(root, parent, id));
    const update = useUpdate();

    subCollapse.updateSubCollapseOption(options);

    const prevOpenedGetter = useRefGetter(subCollapse.isOpened());

    const setOpened = useCallback((open: boolean) => {
        subCollapse.setOpened(open);
    }, []);

    useEffect(() => {
        const change = (): void => {

            if (prevOpenedGetter() !== subCollapse.isOpened()) {
                update();
            }
        };

        root.addListener('open-ids-change', change);

        return () => {
            root.removeListener('open-ids-change', change);
            subCollapse.dispose();
        };
    }, []);

    return {
        setOpened,
        subCollapse,
        lazy: root.getLazy(),
        isOpen: subCollapse.isOpened()
    };
}
