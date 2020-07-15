/**
 * @file RcNotification 通知渲染组件
 */

import {useTimeout} from '@rc-hooks/use';
import React, {ComponentType, HTMLAttributes, LegacyRef} from 'react';
import {IRcPosition} from '@rc-hooks/dialog';
import {INotice, INoticeBaseProps} from '../lib/NotificationInstance';

export interface IRcNotificationProps<T extends INoticeBaseProps>
    extends INotice<T>, HTMLAttributes<HTMLDivElement> {
    space?: number;
    position: IRcPosition;
    Component: ComponentType<T>;
    wrapperRef?: LegacyRef<HTMLDivElement>;
}

export function RcNotification<T extends INoticeBaseProps>(props: IRcNotificationProps<T>): JSX.Element {

    const {
        onClose,
        options,
        space,
        Component,
        position,
        duration = 0,
        wrapperRef,
        ...rest
    } = props;

    useTimeout(duration * 1000, onClose);

    return (
        <div
            {...rest}
            ref={wrapperRef}
            style={{
                textAlign: position.horizontal === 'dock' ? undefined : position.horizontal,
                pointerEvents: 'none',
                marginBottom: space,
                ...rest.style
            }}
        >
            <Component {...options} onClose={onClose} />
        </div>
    );
}
