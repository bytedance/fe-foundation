/**
 * @file events 事件类型处理
 */

// 每项配置
export interface IEventItemConfig {
    __diff_id__: string;
    eventType: string;
    eventFun: string;
    isStop: boolean;
    isPrevent: boolean;
}

export interface IEventConfig {
    eventList: IEventItemConfig[];
}
