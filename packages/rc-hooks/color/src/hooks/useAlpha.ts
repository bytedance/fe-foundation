/**
 * @file useAlpha
 */
import {useCallback} from 'react';
import {IRGBA} from '@co-hooks/color';
import {useColor} from './useColor';

export function useAlpha(): [IRGBA, (alpha: number) => void] {
    const manager = useColor();
    const rgba = manager.getColor().getRGBA();
    const onAlphaChange = useCallback((alpha: number) => {
        manager.emitColorChange(manager.getColor().setAlpha(alpha));
    }, []);
    return [rgba, onAlphaChange];
}
