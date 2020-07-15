/**
 * @file useHue
 */
import {useCallback} from 'react';
import {useColor} from './useColor';

export function useHue(): [number, (hue: number) => void] {
    const manager = useColor();
    const hue = manager.getColor().getHue();
    const onHueChange = useCallback((hue: number) => {
        manager.emitColorChange(manager.getColor().setHue(hue));
    }, []);
    return [hue, onHueChange];
}
