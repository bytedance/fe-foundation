/**
 * @file useColor 获取Color对象
 */
import {useCallback} from 'react';
import {string2RGB} from '@co-hooks/color';
import {useColor} from './useColor';

export function useSetColor(): (color: string) => void {

    const manager = useColor();

    return useCallback(str => {

        const rbga = string2RGB(str);

        if (rbga == null) {
            console.error('str=' + str + 'is an invalid color string');
            return;
        }

        const color = manager.getColor().setRGBA(rbga);
        manager.emitColorChange(color);
    }, []);
}
