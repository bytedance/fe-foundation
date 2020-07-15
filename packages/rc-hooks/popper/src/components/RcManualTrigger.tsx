/**
 * @file RcManualTrigger 气泡触发容器
 */

import {UnionOmit} from '@co-hooks/util';
import React, {HTMLAttributes, Ref, forwardRef, useImperativeHandle, useRef} from 'react';
import {ITriggerOptions, Trigger} from '@co-hooks/popper';
import {usePrevProp} from '@rc-hooks/use';
import {IUseTriggerResult, useTrigger} from '../hooks/useTrigger';

export interface IRcManualTrigger<T> extends ITriggerOptions<T> {
    ref?: Ref<T>;
    triggerId?: string;
    children?: ((data: IUseTriggerResult) => React.ReactNode) | React.ReactNode;
    show?: boolean;
}

export type IRcManualTriggerProps<T> = UnionOmit<IRcManualTrigger<T>, HTMLAttributes<HTMLSpanElement>>;

export const RcManualTrigger = forwardRef(function <T> (
    props: IRcManualTriggerProps<T>,
    ref: Ref<HTMLSpanElement>
): JSX.Element {

    const {
        children,
        disabled,
        data,
        captureOptions,
        triggerId,
        disableToggleClose,
        show = false,
        ...extra
    } = props;

    const triggerRef = useRef<HTMLSpanElement>(null);
    const [equal] = usePrevProp(show);

    useImperativeHandle(ref, () => triggerRef.current as HTMLSpanElement, [triggerRef.current]);

    const [manualTrigger, result] = useTrigger(
        (...args) => new Trigger(...args),
        {disabled, captureOptions, data, disableToggleClose},
        triggerRef,
        'manual',
        triggerId
    );

    if (!equal) {
        show ? manualTrigger.showPopper() : manualTrigger.hidePopper();
    }

    return (
        <span {...extra} ref={triggerRef} data-rc-id={`trigger___${manualTrigger.getId()}`}>
            {typeof children === 'function' ? children(result) : children}
        </span>
    );
}) as <T>(props: IRcManualTriggerProps<T>) => JSX.Element;
