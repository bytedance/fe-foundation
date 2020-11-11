/**
 * @file bind 绑定类数据源
 */

import {IDatasourceConfig} from '@chief-editor/base';
import {FlowDatasource} from '../types';
import {FlowScheduler} from '../lib/FlowScheduler';
import {wrapFunction, wrapWatcher} from '../util/wrap';
import {localDatasourceLoader} from './local';

export interface IFuncDatasourceConfig<V, DS> extends IDatasourceConfig<V, DS> {
    hook: string;
    isWatch: boolean;
    watchKeys: string;
}

export function funcDatasourceLoader<V, DS, DP, CG, ST>(
    scheduler: FlowScheduler<V, DS, DP, CG, ST>,
    config: IDatasourceConfig<V, DS>
): FlowDatasource<V, DS, DP, CG, ST> {

    const {data, defaultValue, func, hook, isWatch, watchKeys} = config as IFuncDatasourceConfig<V, DS>;

    const fn = func != null ? scheduler.getHook(func) : null;
    const hookFn = scheduler.getHook(hook);

    // 函数不存在时，fallback到static兜底，并给出错误提示
    if (hookFn == null) {
        console.log(`hook func name = ${func} is not found`);
        return localDatasourceLoader(scheduler, config);
    }

    const realFn = wrapFunction(hookFn, scheduler.brick);

    const result: FlowDatasource<V, DS, DP, CG, ST> = {

        watcher: isWatch ? wrapWatcher(watchKeys.trim().split('\n'), scheduler.brick) : [],

        // 加载静态数据函数
        loadStaticDatasource(): DS {
            return data;
        },

        // 加载动态数据
        loadDynamicDatasource(data: unknown): Promise<DS> {
            return realFn(data);
        }
    };

    if (defaultValue != null) {
        result.loadStaticDefaultValue = () => defaultValue;
    }

    if (fn != null) {
        result.loadDynamicDefaultValue = fn;
    }

    return result;
}
