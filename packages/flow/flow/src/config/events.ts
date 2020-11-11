/**
 * @file events 事件处理
 */

import {IEventConfig, IEventItemConfig} from '@chief-editor/base';
import {FunctionAny} from '@co-hooks/util';
import {FlowBrick} from '../lib/FlowBrick';

export type IFlowEventMap = Record<string, (e: Event | string, value: any) => void>;

export function extractEvents<V, DS, DP, CG, ST>(
    brick: FlowBrick<V, DS, DP, CG, ST>,
    events?: IEventConfig
): IFlowEventMap {

    const res: IFlowEventMap = {};
    const list = events && events.eventList || [];

    if (!list || !list.length) {
        return res;
    }

    const eventsMap: {[key: string]: any[]} = {};

    list.forEach((item: IEventItemConfig) => {

        const {eventType, eventFun, isStop, isPrevent} = item;

        const realFunc = brick.getHook(eventFun);

        if (realFunc == null) {
            console.error('invalid hook function name = ' + eventFun);
            return;
        }

        eventsMap[eventType] = eventsMap[eventType] || [];
        eventsMap[eventType].push({
            isStop,
            isPrevent,
            func: realFunc
        });
    });

    Object.keys(eventsMap).forEach(type => {
        res[type] = wrapEventFunc(eventsMap[type], brick);
    });

    return res;
}

function wrapEventFunc<V, DS, DP, CG, ST>(
    eventList: Array<{isPrevent: boolean; isStop: boolean; func: FunctionAny}>,
    brick: FlowBrick<V, DS, DP, CG, ST>
) {
    return (e: string | Event, params: unknown): void => {

        let isPrevented = false;
        let stopped = false;

        const promises: Array<Promise<void | string>> = eventList.map(item => {

            if (item.isPrevent && !isPrevented) {
                isPrevented = true;

                if (typeof e !== 'string') {
                    e.preventDefault();
                }
            }

            if (item.isStop && !stopped) {

                stopped = true;

                if (typeof e !== 'string') {
                    e.stopPropagation();
                }
            }

            try {

                const ret = item.func.call(brick, e, brick, params);

                if (ret != null && typeof ret === 'object' && typeof ret.then === 'function') {
                    return ret;
                }

                return Promise.resolve();
            } catch (e) {
                return Promise.reject(e.message);
            }
        });

        Promise
            .all(promises).then(() => Promise.resolve())
            .catch(error => {
                console.error(`dispatch event error, name = ${typeof e === 'string' ? e : e.type}`);
                console.error(error);
            });
    };
}
