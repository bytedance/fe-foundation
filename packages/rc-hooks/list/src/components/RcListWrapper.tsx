/**
 * @file RcListWrapper 滚动容器
 */

import {IElementSize} from '@co-hooks/dom';
import {useElementSize} from '@rc-hooks/dom';
import {UnionOmit} from '@co-hooks/util';
import {useUpdate} from '@rc-hooks/use';
import React, {HTMLAttributes, useEffect, useMemo, useRef} from 'react';
import {useList} from '../hooks/useList';
import {RenderListItem} from './RcListItem';
import {RcListScroller} from './RcListScroller';

export interface IRcListWrapper {
    renderListItem: RenderListItem;
    children: never;
    height?: number;
    needCaptureWidth: boolean;
    needCaptureHeight: boolean;
}

export type IRcListWrapperProps = UnionOmit<IRcListWrapper, HTMLAttributes<HTMLDivElement>>;

export function RcListWrapper(props: IRcListWrapperProps): JSX.Element {

    const {
        style = {},
        renderListItem,
        height = 0,
        needCaptureHeight = false,
        needCaptureWidth = false,
        ...extra
    } = props;
    const ref = useRef<HTMLDivElement>(null);
    const update = useUpdate();
    const list = useList();

    useElementSize(ref, () => needCaptureHeight || needCaptureWidth, (size: IElementSize) => {
        list.updateWrapperSize(size);
    });

    if (!needCaptureHeight) {
        list.updateWrapperSize({height}, true);
    }

    useEffect(() => {

        list.addListener('wrapper-need-update', update);

        return () => {
            list.removeListener('wrapper-need-update', update);
        };
    }, []);

    // 子类不变
    const scroller = useMemo(() => <RcListScroller renderListItem={renderListItem} />, []);
    const size = list.getWrapperSize();

    // 外框完全不需要变化，由内层变化即可
    return (
        <div
            {...extra}
            ref={ref}
            style={{
                ...style,
                overflow: 'hidden auto',
                height: String(size.height) + 'px',
                willChange: 'transform',
                boxSizing: 'border-box',
                width: '100%'
            }}
        >
            {scroller}
        </div>
    );
}
