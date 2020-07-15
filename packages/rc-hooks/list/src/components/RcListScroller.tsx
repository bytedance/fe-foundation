/**
 * @file RcListScroller 虚拟滚动元素
 */
import {useUpdate} from '@rc-hooks/use';
import React, {useEffect, useRef} from 'react';
import {useList} from '../hooks/useList';
import {RcListItem, RenderListItem} from './RcListItem';

export interface IRcListScrollerProps {
    renderListItem: RenderListItem;
}

export function RcListScroller(props: IRcListScrollerProps): JSX.Element {

    const {renderListItem} = props;
    const ref = useRef<HTMLDivElement>(null);
    const update = useUpdate();
    const list = useList();
    const {height} = list.getScrollerSize();

    useEffect(() => {

        const scrollTo = (top: number): void => {

            if (ref.current == null) {
                return;
            }

            ref.current.scrollTop = top;
        };

        list.addListener('scroller-need-update', update);
        list.addListener('scroller-need-scroll', scrollTo);

        return () => {
            list.removeListener('wrapper-need-update', update);
            list.removeListener('scroller-need-scroll', scrollTo);
        };
    }, []);

    // 要渲染的单元格
    const items = list.getRenderItemList();

    // 外框完全不需要变化，由内层变化即可
    return (
        <div
            ref={ref}
            style={{
                width: '100%',
                boxSizing: 'border-box',
                height: String(height) + 'px',
                overflow: 'hidden',
                position: 'relative',
                pointerEvents: list.inScrolling() ? 'none' : undefined
            }}
        >
            {items.map(item => (
                <RcListItem key={item.index} item={item} renderListItem={renderListItem} />
            ))}
        </div>
    );
}
