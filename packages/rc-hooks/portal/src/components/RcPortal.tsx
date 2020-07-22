/**
 * @file RcPortal 传送门
 */

import {ReactNode, ReactPortal, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import {useSingleton} from '@rc-hooks/use';
import {isClient} from '@co-hooks/dom';
import {equal} from '@co-hooks/util';

interface IRcPortal {
    getContainer?: () => HTMLElement | null;
    children: ReactNode;
    onUpdated?: () => void;
}

const documentBody = isClient() ? document.body : null;

export type IRcPortalProps = IRcPortal;

export function RcPortal(props: IRcPortalProps): ReactPortal | null {
    const {
        children,
        getContainer,
        onUpdated
    } = props;

    const prevParent = useRef<HTMLElement | null>(null);
    const container = useSingleton(() => (isClient() ? document.createElement('div') : null));

    const parent = getContainer == null ? documentBody : getContainer();

    const isEqual = equal(prevParent.current, parent);
    prevParent.current = parent;

    if (!isEqual && parent && container) {
        parent.appendChild(container);
    }

    useEffect(() => () => {
        if (container?.parentNode) {
            container.parentNode.removeChild(container);
        }
    }, []);

    useEffect(() => {
        if (parent && onUpdated) {
            onUpdated();
        }
    });

    // parent被挂载成功，才初始化children
    if (parent && container) {
        return ReactDOM.createPortal(children, container);
    }

    return null;
}
