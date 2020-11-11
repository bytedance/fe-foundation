/**
 * @file Datasource
 */

import {IDatasourceConfig} from '@chief-editor/base';
import {FlowScheduler} from '../lib/FlowScheduler';

export interface FlowDatasource<V, DS, DP, CG, ST> {

    watcher: string[];

    // 加载静态数据函数
    loadStaticDatasource: () => DS;

    // 获取动态数据
    loadDynamicDatasource?: (data: unknown) => Promise<DS>;

    // 加载静态默认值
    loadStaticDefaultValue?: () => V;

    // 获取动态默认值（暂时用不到）
    loadDynamicDefaultValue?: () => Promise<V>;
}

// eslint-disable-next-line max-len
export type DatasourceLoader = <V, DS, DP, CG, ST>(
    scheduler: FlowScheduler<V, DS, DP, CG, ST>,
    config: IDatasourceConfig<V, DS>
) => FlowDatasource<V, DS, DP, CG, ST>;
