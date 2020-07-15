/**
 * @file useCreateAnchor
 */
import {useSingleton} from '@rc-hooks/use';
import {IElementScroll, getElementScroll} from '@co-hooks/dom';
import {useScroll} from '@rc-hooks/dom';
import {useRef} from 'react';
import {Anchor, IAnchorOptions} from '@co-hooks/anchor';

export function useCreateAnchor(options: IAnchorOptions): Anchor {

    const anchor = useSingleton(() => new Anchor());
    const scrollInfo = useRef<IElementScroll>(getElementScroll(anchor.getContainer()));

    anchor.updateOptions(options);

    useScroll(
        () => !anchor.getScrolling(),
        () => {
            const newInfo = getElementScroll(anchor.getContainer());

            if (scrollInfo.current.scrollTop !== newInfo.scrollTop) {
                scrollInfo.current = newInfo;
                anchor.updateScrollTop();
            }
        }
    );

    return anchor;
}
