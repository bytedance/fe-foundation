/**
 * @file useHex
 */
import {useRefGetter} from '@rc-hooks/use';
import {useCallback, useContext, useEffect, useState} from 'react';
import {ColorContext} from '../context/color';

export function useHex(): [string, (hex: string) => void, () => void] {

    const manager = useContext(ColorContext);

    if (manager == null) {
        throw new Error('useColor must be use under RcColor');
    }

    const [value, setValue] = useState(() => manager.getColor().toHex());
    const refGetter = useRefGetter(value);

    const onInput = useCallback((val: string) => {
        setValue(val);
        const color = manager.getColor().trySetHex(val);

        if (color) {
            manager.emitColorChange(color);
        }
    }, []);

    const onBlur = useCallback(() => {

        const val = refGetter();
        const color = manager.getColor().trySetHex(val);

        if (color) {
            manager.emitColorChange(color);
            return;
        }

        setValue(manager.getColor().toHex());
    }, []);


    useEffect(() => {

        const handleRepaint = (): void => {
            setValue(manager.getColor().toHex());
        };

        manager.addListener('repaint', handleRepaint);

        return () => manager.removeListener('repaint', handleRepaint);
    }, []);

    return [value, onInput, onBlur];
}
