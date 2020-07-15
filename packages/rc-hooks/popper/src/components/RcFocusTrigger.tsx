/**
 * @file RcFocusTrigger 气泡触发容器
 */

import {UnionOmit} from '@co-hooks/util';
import React, {HTMLAttributes, Ref, forwardRef, useCallback, useImperativeHandle, useRef} from 'react';
import {ITriggerOptions, Trigger} from '@co-hooks/popper';
import {IUseTriggerResult, useTrigger} from '../hooks/useTrigger';

export interface IRcFocusTrigger<T> extends ITriggerOptions<T> {
    ref?: Ref<T>;
    triggerId?: string;
    children?: ((data: IUseTriggerResult) => React.ReactNode) | React.ReactNode;
}

export type IRcFocusTriggerProps<T> = UnionOmit<IRcFocusTrigger<T>, HTMLAttributes<HTMLSpanElement>>;

export const RcFocusTrigger = forwardRef(function <T> (
    props: IRcFocusTriggerProps<T>,
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
    const [focusTrigger, result] = useTrigger(
        (...args) => new Trigger(...args),
        {disabled, captureOptions, data, disableToggleClose},
        triggerRef,
        'click',
        triggerId
    );

    useImperativeHandle(ref, () => triggerRef.current as HTMLSpanElement, [triggerRef.current]);

    const handleFocus = useCallback(() => focusTrigger.showPopper(), []);


    return (
        <span
            {...extra}
            ref={triggerRef}
            data-rc-id={`trigger___${focusTrigger.getId()}`}
            onFocusCapture={handleFocus}
        >
            {typeof children === 'function' ? children(result) : children}
        </span>
    );
}) as <T>(props: IRcFocusTriggerProps<T>) => JSX.Element;
