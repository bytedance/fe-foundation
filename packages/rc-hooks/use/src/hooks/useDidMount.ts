/**
 * @file useDidMount 仅在加载完成后执行
 */

import {EffectCallback, useEffect} from 'react';

export function useDidMount(effect: EffectCallback): void {
    return useEffect(effect, []);
}
