/**
 * @file RcHoverTrigger 气泡触发容器
 */

import {UnionOmit} from '@co-hooks/util';
import React, {HTMLAttributes, Ref, forwardRef, useCallback, useImperativeHandle, useRef} from 'react';
import {HoverTrigger, IHoverTriggerOptions} from '@co-hooks/popper';
import {IUseTriggerResult, useTrigger} from '../hooks/useTrigger';

export interface IRcHoverTrigger<T> extends IHoverTriggerOptions<T> {
    ref?: Ref<T>;
    triggerId?: string;
    children?: ((data: IUseTriggerResult) => React.ReactNode) | React.ReactNode;
}

export type IRcHoverTriggerProps<T> = UnionOmit<IRcHoverTrigger<T>, HTMLAttributes<HTMLSpanElement>>;

export const RcHoverTrigger = forwardRef(function <T> (
    props: IRcHoverTriggerProps<T>,
    ref: Ref<HTMLSpanElement>
): JSX.Element {

    const {
        children,
        showDelay,
        hideDelay,
        disabled,
        captureOptions,
        data,
        triggerId,
        disableToggleClose,
        ...extra
    } = props;

    const triggerRef = useRef<HTMLSpanElement>(null);
    const [hoverTrigger, result, options] = useTrigger(
        (...args) => new HoverTrigger(...args),
        {
            showDelay,
            hideDelay,
            disabled,
            captureOptions,
            data,
            disableToggleClose
        },
        triggerRef,
        'hover',
        triggerId
    );


    useImperativeHandle(ref, () => triggerRef.current as HTMLSpanElement, [triggerRef.current]);

    hoverTrigger.updateHoverTriggerOptions(options);

    const handleMouseEnter = useCallback(() => hoverTrigger.showPopper(), []);
    const handleMouseLeave = useCallback(() => hoverTrigger.hidePopper(), []);

    return (
        <span
            {...extra}
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            data-rc-id={`trigger___${hoverTrigger.getId()}`}
        >
            {typeof children === 'function' ? children(result) : children}
        </span>
    );
}) as <T> (props: IRcHoverTriggerProps<T>) => JSX.Element;
