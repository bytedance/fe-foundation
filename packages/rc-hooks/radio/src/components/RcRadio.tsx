/**
 * @file RcRadio 单选类组件
 */

import {UnionOmit} from '@co-hooks/util';
import React, {ChangeEvent, InputHTMLAttributes, useCallback} from 'react';

export interface IRcRadio {
    disabled?: boolean;
    checked: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export type IRcRadioProps = UnionOmit<IRcRadio, InputHTMLAttributes<HTMLInputElement>>;

export function RcRadio(props: IRcRadioProps) {

    const {
        checked,
        disabled = false,
        onChange,
        className,
        style,
        children,
        ...extra
    } = props;

    const onRadioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e);
        }
    }, [onChange]);

    return (
        <label className={className} style={style}>
            <input
                {...extra}
                type="radio"
                checked={checked}
                disabled={disabled}
                style={{
                    pointerEvents: 'none',
                    zIndex: -1,
                    opacity: 0,
                    visibility: 'hidden'
                }}
                onChange={onRadioChange}
            />
            {children}
        </label>
    );
}
