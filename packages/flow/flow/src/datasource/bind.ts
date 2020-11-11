/**
 * @file func 函数式绑定
 */

import {BindType, IDatasourceConfig} from '@chief-editor/base';
import {FlowScheduler} from '../lib/FlowScheduler';
import {FlowDatasource} from '../types';
import {wrapFunction, wrapInterpolation, wrapWatcher} from '../util/wrap';

export interface IBindDatasourceConfig<V, DS> extends IDatasourceConfig<V, DS> {
    bindType: BindType;
    bindJs: string;
    bindKey: string;
}

export function bindDatasourceLoader<V, DS, DP, CG, ST>(
    scheduler: FlowScheduler<V, DS, DP, CG, ST>,
    config: IDatasourceConfig<V, DS>
): FlowDatasource<V, DS, DP, CG, ST> {

    const {data, defaultValue, func: hookFn, bindType, bindJs, bindKey} = config as IBindDatasourceConfig<V, DS>;

    const {watchers, func} = wrapInterpolation(bindType === BindType.VAR ? bindKey : bindJs, scheduler.brick);

    const realFn = wrapFunction(func, scheduler.brick);

    const hook = hookFn != null ? scheduler.getHook(hookFn) : null;

    const result: FlowDatasource<V, DS, DP, CG, ST> = {

        watcher: wrapWatcher(watchers, scheduler.brick),

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

    if (hook != null) {
        result.loadDynamicDefaultValue = hook;
    }

    return result;
}
