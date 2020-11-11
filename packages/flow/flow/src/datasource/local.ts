/**
 * @file local 本地数据
 */
import {IDatasourceConfig} from '@chief-editor/base';
import {FlowDatasource} from '../types';
import {FlowScheduler} from '../lib/FlowScheduler';

export function localDatasourceLoader<V, DS, DP, CG, ST>(
    scheduler: FlowScheduler<V, DS, DP, CG, ST>,
    config: IDatasourceConfig<V, DS>
): FlowDatasource<V, DS, DP, CG, ST> {

    const {data, defaultValue} = config;

    const result: FlowDatasource<V, DS, DP, CG, ST> = {

        watcher: [],

        // 加载静态数据函数
        loadStaticDatasource(): DS {
            return data;
        },

        // 加载动态数据
        loadDynamicDatasource(): Promise<DS> {
            return Promise.resolve(data);
        }
    };

    if (defaultValue != null) {
        result.loadStaticDefaultValue = () => defaultValue;
    }

    return result;
}
