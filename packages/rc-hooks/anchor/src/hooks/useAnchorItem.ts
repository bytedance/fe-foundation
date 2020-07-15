/**
 * @file useAnchorItem
 */
import {useSingleton, useUpdate} from '@rc-hooks/use';
import {useEffect} from 'react';
import {IUseScrollToResult, useScrollTo} from '@rc-hooks/dom';
import {AnchorItem} from '@co-hooks/anchor';
import {useAnchor} from './useAnchor';
import {useParentAnchorItem} from './useParentAnchorItem';

export interface IUseAnchorItemResult extends IUseScrollToResult {
    anchorItem: AnchorItem;
    level: number;
    isActive: boolean;
    activeDot: boolean;
    hashLink: boolean;
}

export function useAnchorItem(
    href: string,
    id?: string
): IUseAnchorItemResult {
    const anchor = useAnchor();
    const parent = useParentAnchorItem();
    const anchorItem = useSingleton(() => new AnchorItem(anchor, parent, id));

    anchorItem.updateOptions({href});
    const update = useUpdate();

    useEffect(() => {
        const status = anchorItem.updateOffsetTop();
        status && update();
    }, [anchor.getContainer(), href]);

    useEffect(() => {
        anchor.addListener('active-item', update);

        return () => {
            anchor.removeListener('active-item', update);
            anchorItem.dispose();
        };
    }, []);

    const scrollToResult = useScrollTo(
        anchor.getContainer(),
        'top',
        () => {
            anchorItem.updateOffsetTop();
            return anchorItem.getOffsetTop() - anchor.getTargetOffset();
        },
        300,
        () => !!anchor.getContainer(),
        {
            start: () => {
                anchor.setScrolling(true);
            },
            end: () => {
                anchor.setScrolling(false);
            }
        }
    );

    return {
        anchorItem,
        level: anchorItem.getLevel(),
        isActive: anchorItem.getId() === anchor.getActiveId(),
        activeDot: anchor.getActiveDot(),
        hashLink: anchor.getHashLink(),
        ...scrollToResult
    };
}
