/**
 * @file RcColor 颜色处理类
 */
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import React, {ReactNode, useEffect} from 'react';
import {Color, ColorManager, IColorOptions} from '@co-hooks/color';
import {ColorContext} from '../context/color';

export interface IRcColorProps extends IColorOptions {
    children?: ReactNode;
    onChange?: (color: Color) => void;
    onValueChange?: (color: string) => void;
}

export function RcColor(props: IRcColorProps): JSX.Element {

    const {
        children,
        onChange,
        onValueChange,
        ...extra
    } = props;
    const manager = useSingleton(() => new ColorManager());
    const onChangeCallback = useRefCallback(onChange);
    const onValueChangeCallback = useRefCallback(onValueChange);

    manager.updateOptions(extra);

    useEffect(() => {

        const handler = (color: Color): void => {
            onChangeCallback(color);
            onValueChangeCallback(color.toString());
        };

        manager.addListener('change', handler);

        return () => manager.removeListener('change', handler);
    }, []);

    return (
        <ColorContext.Provider value={manager}>
            {children}
        </ColorContext.Provider>
    );
}
