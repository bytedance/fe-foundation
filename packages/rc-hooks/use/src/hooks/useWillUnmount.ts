/**
 * @file useWillUnmount 仅在加载完成后执行
 */

import {useEffect} from 'react';

export function useWillUnmount(effect: VoidFunction): void {
    return useEffect(() => () => {
        effect();
    }, []);
}
