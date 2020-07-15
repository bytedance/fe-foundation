/**
 * @file useUpdate 强制更新组件
 */

import { useCallback, useState } from 'react';
import { guid } from '@co-hooks/util';

export function useUpdate(): VoidFunction {

    const [, setState] = useState('');

    return useCallback(() => {

        setState(guid());
    }, []);
}
