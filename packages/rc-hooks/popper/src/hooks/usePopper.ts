/**
 * @file usePopper
 */
import {useSingleton} from '@rc-hooks/use';
import {useEffect} from 'react';
import {Popper, popperCore} from '@co-hooks/popper';

export interface IUsePopperResult<T> {
    popper: Popper<T>;
}

export function usePopper<T>(): IUsePopperResult<T> {

    const popper = useSingleton(() => new Popper<T>());

    useEffect(() => {
        // 必须后置react的事件绑定，否则会出现触发顺序问题
        popperCore.initPopperCoreEvent();
        return () => popper.dispose();
    }, []);

    return {
        popper
    };
}
