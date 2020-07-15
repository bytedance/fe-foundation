/**
 * @file RcNotificationContainer 通知渲染容器
 */

import {IUseChildrenEnterLeaveOptions, useChildrenEnterLeave} from '@rc-hooks/animation';
import {IRcPosition, RcDialog} from '@rc-hooks/dialog';
import React, {ComponentType, useCallback, useEffect} from 'react';
import {useNoticeList} from '../hooks/useNoticeList';
import {INoticeBaseProps} from '../lib/NotificationInstance';
import {IRcNotificationProps, RcNotification} from './RcNotification';

export interface IRcNotificationContainerProps<T extends INoticeBaseProps> {
    maxCount?: number;
    space?: number;
    placement: string;
    position: IRcPosition;
    Component: ComponentType<T>;
    container: HTMLElement;
    animation?: IUseChildrenEnterLeaveOptions<IRcNotificationProps<T>>;
}

export function RcNotificationContainer<T extends INoticeBaseProps>(
    props: IRcNotificationContainerProps<T>
): JSX.Element {

    const {position, space = 0, Component, placement, container, animation} = props;
    const notices = useNoticeList<T>(placement);
    const getContainer = useCallback(() => container, [container]);

    const noticeList = notices.map(item => (
        <RcNotification
            {...item}
            key={item.key}
            space={space}
            position={position}
            Component={Component}
        />
    ));

    const [children, start] = useChildrenEnterLeave(noticeList, animation ?? {disabled: true});

    useEffect(start);

    return (
        <RcDialog
            {...position}
            forceFixed
            forceUpdateZIndex
            preventPointerEvent
            show
            getContainer={getContainer}
        >
            {children}
        </RcDialog>
    );
}
