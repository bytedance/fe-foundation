/**
 * @file useColorBoard
 */
import {IRGBA} from '@co-hooks/color';
import {useColor} from './useColor';

export function useColorBoard(): IRGBA {
    const manager = useColor();
    return manager.getColor().getRGBA();
}
