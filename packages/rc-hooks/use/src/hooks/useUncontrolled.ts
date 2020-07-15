/**
 * @file useUncontrolled 判断是否可控状态
 */
import {useRefCallback} from '@rc-hooks/use';
import {useRef, useState} from 'react';

export function useUncontrolled<T, V extends string, D extends string, O extends string>(
    controlled: boolean,
    fallback: T,
    value?: T,
    defaultValue?: T,
    onChange?: (value: T) => void,
    propsName?: string
): [T, (value: T) => void] {

    const controlledRef = useRef(controlled);
    const onChangeCallback = useRefCallback(onChange);

    if (controlled !== controlledRef.current) {
        console.warn('Warning: '
            + 'you should not switch `' + (propsName || 'props') + '` from uncontrolled to controlled (or vice versa). '
            + 'Decide between using controlled props or uncontrolled props for the lifetime of this component'
        );
    }

    const [innerValue, setInnerValue] = useState(() => (defaultValue !== undefined ? defaultValue : fallback));

    if (controlledRef.current) {
        return [value !== undefined ? value : fallback, onChangeCallback];
    }

    return [innerValue, setInnerValue];
}
