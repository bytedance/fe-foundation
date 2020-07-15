/**
 * @file RcListItem 虚拟滚动子项
 */

import {getElementContentSize} from '@co-hooks/dom';
import React, {CSSProperties, ReactNode, useEffect, useMemo, useRef} from 'react';
import {useList} from '../hooks/useList';
import {IListSizeInfo} from '../lib/ListSizeManager';

export type RenderListItem = (index: number) => {
    style?: CSSProperties;
    className?: string;
    children: ReactNode;
};

export interface IRcListItemOptions {
    item: IListSizeInfo;
    renderListItem: RenderListItem;
}

export function RcListItem(props: IRcListItemOptions): JSX.Element {

    const {item, renderListItem} = props;
    const list = useList();
    const {offset, dynamic, size, index} = item;
    const ref = useRef<HTMLDivElement>(null);
    const content = useMemo(() => renderListItem(index), [renderListItem, index]);
    const {style = {}, children, className} = content;

    useEffect(() => {
        if (dynamic && ref.current) {
            const size = getElementContentSize(ref.current, true);
            list.updateItemSize(index, size);
        }
    });

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...style,
                width: '100%',
                boxSizing: 'border-box',
                position: 'absolute',
                height: String(size) + 'px',
                left: '0',
                top: String(offset) + 'px'
            }}
        >
            {children}
        </div>
    );
}
