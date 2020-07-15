/**
 * @file useContainer 将一个Dom元素的Ref包装成一个获取Dom的函数
 */

import {useRefGetter} from '@rc-hooks/use';
import {RefObject, useCallback} from 'react';

export type UseContainerResult = () => HTMLElement | null;

export function useContainer(elem: RefObject<HTMLElement> | HTMLElement | null): UseContainerResult {

    const elemGetter = useRefGetter(elem);

    return useCallback(() => {

        const element = elemGetter();

        if (element == null || element instanceof HTMLElement) {
            return element;
        }

        return element.current;
    }, []);

}
