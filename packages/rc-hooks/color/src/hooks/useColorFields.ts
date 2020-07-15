/**
 * @file useColorFields
 */
import {useCallback} from 'react';
import {IHSL, IRGBA} from '@co-hooks/color';
import {useColor} from './useColor';

export interface IColorFieldsCallback {
    onHueChange: (v: number) => void;
    onSaturationChange: (v: number) => void;
    onLightChange: (v: number) => void;
    onRedChange: (v: number) => void;
    onGreenChange: (v: number) => void;
    onBlueChange: (v: number) => void;
    onAlphaChange: (v: number) => void;
}

export function useColorFields(): [IRGBA & IHSL, IColorFieldsCallback] {
    const manager = useColor();
    const rgba = manager.getColor().getRGBA();
    const hsl = manager.getColor().getHSL();
    const onHueChange = useCallback((value: number) => {
        manager.emitColorChange(manager.getColor().setHue(value));
    }, []);
    const onSaturationChange = useCallback((value: number) => {
        manager.emitColorChange(manager.getColor().setSaturation(value));
    }, []);
    const onLightChange = useCallback((value: number) => {
        manager.emitColorChange(manager.getColor().setLight(value));
    }, []);
    const onRedChange = useCallback((value: number) => {
        manager.emitColorChange(manager.getColor().setRed(value));
    }, []);
    const onGreenChange = useCallback((value: number) => {
        manager.emitColorChange(manager.getColor().setGreen(value));
    }, []);
    const onBlueChange = useCallback((value: number) => {
        manager.emitColorChange(manager.getColor().setBlue(value));
    }, []);
    const onAlphaChange = useCallback((value: number) => {
        manager.emitColorChange(manager.getColor().setAlpha(value));
    }, []);
    return [
        {
            ...rgba,
            ...hsl
        },
        {
            onHueChange,
            onSaturationChange,
            onLightChange,
            onRedChange,
            onGreenChange,
            onBlueChange,
            onAlphaChange
        }
    ];
}
