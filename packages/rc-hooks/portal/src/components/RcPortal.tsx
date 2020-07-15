/**
 * @file RcPortal 传送门
 */

import {ReactNode, ReactPortal, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import {useSingleton} from '@rc-hooks/use';
import {equal} from '@co-hooks/util';

interface IRcPortal {
    getContainer?: () => HTMLElement | null;
    children: ReactNode;
    onUpdated?: () => void;
}

export type IRcPortalProps = IRcPortal;

export function RcPortal(props: IRcPortalProps): ReactPortal | null {
    const {
        children,
        getContainer,
        onUpdated
    } = props;

    const prevParent = useRef<HTMLElement | null>(null);
    const container = useSingleton(() => document.createElement('div'));

    const parent = getContainer == null ? document.body : getContainer();

    const isEqual = equal(prevParent.current, parent);
    prevParent.current = parent;

    if (!isEqual && parent) {
        parent.appendChild(container);
    }

    useEffect(() => () => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }, []);

    useEffect(() => {
        if (parent && onUpdated) {
            onUpdated();
        }
    });

    // parent被挂载成功，才初始化children
    if (parent) {
        return ReactDOM.createPortal(children, container);
    }

    return null;
}
