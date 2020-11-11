/**
 * @file useRuntime 获取运行时上下文
 */
import {useContext} from 'react';
import {RuntimeContext} from '../context/runtime';
import {IRuntimeContext} from '../types';

export function useRuntime(): IRuntimeContext {

    const runtime = useContext(RuntimeContext);

    if (runtime == null) {
        throw new Error('useRuntime must be use with RuntimeProvider');
    }

    return runtime;
}
