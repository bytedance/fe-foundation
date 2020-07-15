/**
 * @file useColor 获取Color对象
 */
import {useContext, useEffect} from 'react';
import {useUpdate} from '@rc-hooks/use';
import {ColorManager} from '@co-hooks/color';
import {ColorContext} from '../context/color';


export function useColor(): ColorManager {

    const color = useContext(ColorContext);
    const update = useUpdate();

    if (color == null) {
        throw new Error('useColor must be use under RcColor');
    }

    useEffect(() => {
        color.addListener('repaint', update);
        return () => color.removeListener('repaint', update);
    }, []);

    return color;
}
