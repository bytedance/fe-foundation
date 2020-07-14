/**
 * @file event Dom事件绑定函数
 */

import {getUniqueKey} from '@co-hooks/util';

type EventHandler<T = HTMLElement> = (this: T, e: Event) => void;

interface IEventHandler<T = HTMLElement> {
    element: T;
    passive: boolean;
    setup: () => void;
    teardown: () => void;
    handler: (e: Event) => void;
    events: Array<EventHandler<T>>;
}

interface IEventHandlerMap<T> {
    [key: string]: IEventHandler<T>;
}

// 当前监控的元素的集合
const ELEMENT_MAP: {[key: string]: IEventHandlerMap<GlobalEventHandlers>} = {};

function createEventHandlerInfo<T extends GlobalEventHandlers>(
    element: T,
    type: string,
    passive: boolean = false
): IEventHandler<T> {

    const capture = /(capture:)/.test(type);
    const realType = capture ? type.slice(RegExp.$1.length) : type;

    const info: IEventHandler<T> = {
        passive,
        setup: () => {
            info.element.addEventListener(realType, info.handler, {
                capture,
                passive
            });
        },
        teardown: () => {
            info.element.removeEventListener(realType, info.handler, capture);
        },
        element,
        handler: (e: Event) => {
            info.events.forEach(item => {
                item.call(info.element, e);
            });
        },
        events: []
    };

    return info;
}

/**
 * 绑定一个事件
 *
 * @param element 要绑定事件的元素
 * @param type 事件类型（如果要捕获，可以传递capture:click这样的方式）
 * @param listener 监听函数
 * @param passive 是否不阻止默认行为
 */
export function addEventListener<T extends GlobalEventHandlers>(
    element: T,
    type: string,
    listener: EventHandler<T>,
    passive: boolean = false
): void {

    const key = getUniqueKey(element);
    const info = ELEMENT_MAP[key] = ELEMENT_MAP[key] || {};
    const handlerInfo = info[type] = info[type] || createEventHandlerInfo(element, type, passive);
    const needSetup = handlerInfo.events.length === 0;

    handlerInfo.events.push(listener as EventHandler<GlobalEventHandlers>);

    if (needSetup) {
        handlerInfo.setup();
    }
}

export function removeEventListener<T extends GlobalEventHandlers>(
    element: T,
    type?: string,
    listener?: EventHandler<T>
): void {

    const key = getUniqueKey(element);
    const info = ELEMENT_MAP[key];

    if (info == null) {
        return;
    }

    if (type == null) {
        Object.keys(info).forEach(k => {
            removeEventListener(element, k, listener);
        });
        return;
    }

    const handlerInfo = info[type];

    if (handlerInfo == null) {
        return;
    }

    if (listener) {

        const index = handlerInfo.events.indexOf(listener as EventHandler<GlobalEventHandlers>);

        if (index >= 0) {
            handlerInfo.events.splice(index, 1);
        }
    } else {
        handlerInfo.events = [];
    }

    // 解绑事件
    if (handlerInfo.events.length === 0) {
        handlerInfo.teardown();
        delete info[type];
    }

    if (Object.keys(info).length === 0) {
        delete ELEMENT_MAP[key];
    }
}
