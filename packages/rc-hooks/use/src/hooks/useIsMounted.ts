/**
 * @file useIsMounted 组件是否加载
 */

import {useEffect, useState} from 'react';

export function useIsMounted(): boolean {

    const [isMount, setIsMount] = useState(false);

    useEffect(() => {

        if (!isMount) {
            setIsMount(true);
        }

        return () => setIsMount(false);
    }, []);

    return isMount;
}
