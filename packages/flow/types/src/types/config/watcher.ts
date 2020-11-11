/**
 * @file watcher
 */

export enum WatcherType {

    // 刷新组件（只重新进行一次渲染）
    REFRESH = 0,

    // 重新校验组件（重新执行校验函数，不会重新设置值）
    VALIDATE = 1,

    // 校验数值合法性（这个可能会造成值的更改，这个更改会触发新的Watcher）
    CHECK_VALUE = 2,

    // 加载数据源
    LOAD_DATASOURCE = 3,

    // 执行函数
    FUNC = 4
}

export interface IWatcherPathConfig {
    __diff_id__: string;

    type: Exclude<WatcherType, WatcherType.FUNC>;

    // 监控的字段
    watchKeys: string;
}

export interface IWatcherFuncConfig {
    __diff_id__: string;

    type: WatcherType.FUNC;

    // 执行的函数
    watchFunc: string;

    // 监控的字段
    watchKeys: string;

    // 是否立即执行
    watchImmediate: boolean;

    // 是否惰性函数（会产生异步请求的函数，尽量设置为惰性函数，以避免在同一个时间周期内发生多次）
    lazy: boolean;
}

export type IWatcherItemConfig = IWatcherPathConfig | IWatcherFuncConfig;

export interface IWatcherConfig {
    watchers: IWatcherItemConfig[];
}
