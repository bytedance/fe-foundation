/**
 * @file RcContextMenuTrigger 气泡触发容器
 */

import React, {HTMLAttributes, Ref, forwardRef, useImperativeHandle, useRef} from 'react';
import {UnionOmit} from '@co-hooks/util';
import {ITriggerOptions, Trigger} from '@co-hooks/popper';
import {IUseTriggerResult, useTrigger} from '../hooks/useTrigger';

export interface IRcContextMenuTrigger<T> extends ITriggerOptions<T> {
    ref?: Ref<T>;
    triggerId?: string;
    children?: ((data: IUseTriggerResult) => React.ReactNode) | React.ReactNode;
}

export type IRcContextMenuTriggerProps<T> = UnionOmit<IRcContextMenuTrigger<T>, HTMLAttributes<HTMLSpanElement>>;

export const RcContextMenuTrigger = forwardRef(function <T> (
    props: IRcContextMenuTriggerProps<T>,
    ref: Ref<HTMLSpanElement>
): JSX.Element {

    const {
        children,
        disabled,
        data,
        captureOptions,
        triggerId,
        disableToggleClose,
        ...extra
    } = props;

    const triggerRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => triggerRef.current as HTMLSpanElement, [triggerRef.current]);

    const [clickTrigger, result] = useTrigger(
        (...args) => new Trigger(...args),
        {disabled, captureOptions, data, disableToggleClose},
        triggerRef,
        'contextmenu',
        triggerId
    );

    return (
        <span {...extra} ref={triggerRef} data-rc-id={`trigger___${clickTrigger.getId()}`}>
            {typeof children === 'function' ? children(result) : children}
        </span>
    );
}) as <T>(props: IRcContextMenuTriggerProps<T>) => JSX.Element;
