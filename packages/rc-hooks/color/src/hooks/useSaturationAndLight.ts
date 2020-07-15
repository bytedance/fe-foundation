/**
 * @file useSaturationAndLight
 */
import {useCallback} from 'react';
import {IHSL, ISL} from '@co-hooks/color';
import {useColor} from './useColor';

export function useSaturationAndLight(): [IHSL, (offset: ISL) => void] {
    const manager = useColor();
    const hsl = manager.getColor().getHSL();
    const onChange = useCallback((sl: ISL) => {
        manager.emitColorChange(manager.getColor().setSL(sl));
    }, []);
    return [hsl, onChange];
}
