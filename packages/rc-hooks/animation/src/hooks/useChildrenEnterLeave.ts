import {AnimateType, CubicBezierGetter, cubicBezier, presets} from '@co-hooks/util';
import {usePrevProp, useRefCallback, useSingleton, useUpdate} from '@rc-hooks/use';
import React, {Key, ReactElement, ReactNode, useEffect, useRef} from 'react';

type LayoutChangeType = 'enter' | 'leave' | 'move';

interface FrameAnimationTick {
    (now?: number): void;
    frame?: number;
}

interface DomNodeInfo {
    element?: HTMLElement;
    memo?: unknown;
    startTime?: number;
}

type EnterFrameAnimationTick =
    (domNode: HTMLElement, percent: number, memo: unknown, key: Key) => unknown;
type LeaveFrameAnimationTick =
    (domNode: HTMLElement, percent: number, memo: unknown, key: Key) => unknown;
type MoveFrameAnimationTick =
    (domNode: HTMLElement, percent: number, moved: number, memo: unknown, key: Key) => unknown;

export interface IUseChildrenEnterLeaveOptions<T = {}> {
    /**
     * 子元素 ref 的属性名，一般用于设置函数组件 children 的 ref，
     * 值为 `null` 或空字符串时会跳过当前元素
     * @default
     * 'ref'
     */
    childRefKey?: string | null | ((reactElement: ReactElement) => string | null);
    /**
     * 是否禁用动画
     */
    disabled?: boolean;
    /**
     * 帧动画时长，可单独为进场、离场、移动动画设置不同的时长
     */
    duration?: number | Record<LayoutChangeType, number>;
    /**
     * 覆盖即将进场的子元素的部分或全部 props
     */
    enterChildProps?: Partial<T> | ((prev: T, key: Key) => Partial<T>);
    /**
     * 进场帧动画
     */
    enterTick?: EnterFrameAnimationTick;
    /**
     * 忽略初次渲染时的入场动效
     */
    ignoreInitialRender?: boolean;
    /**
     * 覆盖即将离场的子元素的部分或全部 props
     */
    leaveChildProps?: Partial<T> | ((prev: T, key: Key) => Partial<T>);
    /**
     * 离场帧动画
     */
    leaveTick?: LeaveFrameAnimationTick;
    /**
     * 覆盖即将移动的子元素的部分或全部 props
     */
    moveChildProps?: Partial<T> | ((prev: T, key: Key, moved: number) => Partial<T>);
    /**
     * 移动帧动画，第三个参数为移动前与移动后的 index 差值
     */
    moveTick?: MoveFrameAnimationTick;
    /**
     * **所有正在进行的** 进场、离场、移动帧动画结束时的回调
     */
    onFrameAnimationEnd?: () => void;
    /**
     * 如果没有拿到子元素的 ref，是否跳过此元素的动画
     * @default
     * true
     */
    skipChildWithoutRef?: boolean;
    /**
     * 帧动画速率曲线，可单独为进场、离场、移动动画设置不同的速率曲线
     * @default
     * - enter: ease-out
     * - leave: ease-in
     * - move: ease-in-out
     */
    timingFunction?: AnimateType | Record<LayoutChangeType, AnimateType>;
    /**
     * 动画事件结束后主动自刷新，以重新 diff children ，清除 `enterChildProps`、`leaveChildProps`、
     * `moveChildProps` 的副作用
     * @default
     * true
     */
    updateAfterAnimation?: boolean;
}

export function useChildrenEnterLeave<T>(
    children: ReactNode,
    options: IUseChildrenEnterLeaveOptions<T> = {}
): [ReactNode, () => () => void] {
    const {
        childRefKey = 'ref',
        disabled,
        duration,
        enterChildProps,
        ignoreInitialRender,
        leaveChildProps,
        moveChildProps,
        onFrameAnimationEnd,
        skipChildWithoutRef = true,
        timingFunction,
        updateAfterAnimation = true
    } = options;

    const {
        enterTick,
        leaveTick,
        moveTick
    } = getEnterLeaveMoveTick(options);

    const getEnterChildProps = isNotPropsGetter(enterChildProps)
        ? () => enterChildProps
        : enterChildProps;
    const getLeaveChildProps = isNotPropsGetter(leaveChildProps)
        ? () => leaveChildProps
        : leaveChildProps;
    const getMoveChildProps = isNotPropsGetter(moveChildProps)
        ? () => moveChildProps
        : moveChildProps;

    const forceUpdate = useUpdate();
    const initialRender = useRef(true);

    const leavingKeys = useSingleton(() => new Set<Key>());
    const enteringKeys = useSingleton(() => new Set<Key>());
    const movingKeys = useSingleton(() => new Map<Key, number>());

    const childMap = new Map<Key, [number, ReactElement]>();
    const prevChildMap = usePrevProp(childMap, () => false)[1];
    const domNodeMap = useSingleton(() => new Map<Key, DomNodeInfo>());

    const handleFrameAnimationEnd = useRefCallback(() => {
        onFrameAnimationEnd?.();
        if (updateAfterAnimation) {
            forceUpdate();
        }
    });

    useEffect(() => {
        initialRender.current = false;
    }, []);

    if (disabled || (ignoreInitialRender && initialRender.current)) {
        React.Children.toArray(children).forEach((child, index) => {
            if (React.isValidElement(child) && child.key) {
                childMap.set(child.key, [index, child]);
            }
        });
        return [children, () => () => void 0];
    }

    /** DIFF CHILDREN START */

    const childRef = (key: Key) => (element: HTMLElement | null): void => {
        if (element) {
            domNodeMap.set(key, {...domNodeMap.get(key), element});
        } else if (!enteringKeys.has(key) && !leavingKeys.has(key) && !movingKeys.has(key)) {
            // 避免 children 更新时，正在进行的帧动画中断
            domNodeMap.delete(key);
        }
    };

    const handleClone = (child: ReactNode, index: number): ReactNode => {
        if (!React.isValidElement(child) || !child.key) {
            return child;
        }

        const key = child.key;
        const exists = prevChildMap !== childMap && prevChildMap.get(key);
        const moved = exists && exists[0] !== index;
        const rewriteProps = !exists
            ? getEnterChildProps(child.props, key)
            : moved ? getMoveChildProps(child.props, key, exists[0] - index) : {};

        if (exists) {
            // prevChildMap 最终只会剩下需要离场的子元素
            prevChildMap.delete(key);
            // 保存移动的 index 数量
            moved && movingKeys.set(key, exists[0] - index);
        } else {
            leavingKeys.delete(key);
            enteringKeys.add(key);
        }

        // if (__DEV__ && childMap.has(key)) {
        //     console.warn(`[useChildrenEnterLeave] duplicate key found '${key}'.`);
        // }

        const refKey = typeof childRefKey === 'function' ? childRefKey(child) : childRefKey;

        // @see https://reactjs.org/docs/react-api.html#cloneelement
        const reactNode = React.cloneElement(child, {
            ...rewriteProps,
            ...(refKey ? {[refKey]: childRef(key)} : {})
        });

        childMap.set(key, [index, reactNode]);

        return reactNode;
    };

    const clonedChildren = React.Children.toArray(children).map(handleClone);

    if (prevChildMap !== childMap) {
        prevChildMap.forEach(([index, child], key) => {
            leavingKeys.add(key);
            enteringKeys.delete(key);

            const refKey = typeof childRefKey === 'function' ? childRefKey(child) : childRefKey;
            const reactNode = React.cloneElement(child, {
                ...getLeaveChildProps(child.props, key),
                ...(refKey ? {[refKey]: childRef(key)} : {})
            });

            clonedChildren.splice(index, 0, reactNode);
        });
    }

    /** DIFF CHILDREN END */

    if (!leavingKeys.size && !enteringKeys.size && !movingKeys.size) {
        return [children, () => () => void 0];
    }

    if (duration === undefined || (!enterTick && !leaveTick && !moveTick)) {
        return [children, () => () => void 0];
    }

    const durations = getDuration(duration);
    const timings = getTimingFunction(timingFunction);

    const tick: FrameAnimationTick = (now: number = performance.now()) => {
        if (enterTick) {
            enteringKeys.forEach(key => {
                const domNode = getDomNode(domNodeMap, enteringKeys, key, skipChildWithoutRef);
                const {percent, finished} = getPercent(domNode, now, durations, timings, 'enter');
                if (finished) {
                    enteringKeys.delete(key);
                    if (!domNode.element) {
                        domNodeMap.delete(key);
                    }
                }
                if (domNode.element) {
                    domNode.memo = enterTick(domNode.element, percent, domNode.memo, key);
                }
            });
        } else {
            enteringKeys.clear();
        }

        if (leaveTick) {
            leavingKeys.forEach(key => {
                const domNode = getDomNode(domNodeMap, leavingKeys, key, skipChildWithoutRef);
                const {percent, finished} = getPercent(domNode, now, durations, timings, 'leave');
                if (finished) {
                    leavingKeys.delete(key);
                    if (!domNode.element) {
                        domNodeMap.delete(key);
                    }
                }
                if (domNode.element) {
                    domNode.memo = leaveTick(domNode.element, percent, domNode.memo, key);
                }
            });
        } else {
            leavingKeys.clear();
        }

        if (moveTick) {
            movingKeys.forEach((moved, key) => {
                const domNode = getDomNode(domNodeMap, movingKeys, key, skipChildWithoutRef);
                const {percent, finished} = getPercent(domNode, now, durations, timings, 'move');
                if (finished) {
                    movingKeys.delete(key);
                    if (!domNode.element) {
                        domNodeMap.delete(key);
                    }
                }
                if (domNode.element) {
                    domNode.memo = moveTick(domNode.element, percent, moved, domNode.memo, key);
                }
            });
        } else {
            movingKeys.clear();
        }

        if (!enteringKeys.size && !leavingKeys.size && !movingKeys.size) {
            tick.frame = undefined;
            handleFrameAnimationEnd();
        } else {
            tick.frame = requestAnimationFrame(tick);
        }
    };

    const start = (): () => void => {
        tick.frame = requestAnimationFrame(tick);
        return () => {
            tick.frame !== undefined && cancelAnimationFrame(tick.frame);
        };
    };

    return [clonedChildren, start];
}

/**
 * 检查元素是否存在
 * - 如果元素不存在，移除当前动画
 * - 如果元素存在，但没有挂载在文档中，移除当前动画与元素的信息
 */
function getDomNode(
    map: Map<Key, DomNodeInfo>,
    keys: Set<Key> | Map<Key, number>,
    key: Key,
    skipChildWithoutRef: boolean
): DomNodeInfo {
    let domNode = map.get(key);
    if (!domNode) {
        domNode = {};
        map.set(key, domNode);
    }

    if (!domNode.element) {
        if (skipChildWithoutRef) {
            map.delete(key);
            keys.delete(key);
        }
    } else if (!domNode.element.isConnected) {
        map.delete(key);
        keys.delete(key);
    }

    return domNode;
}

function getPercent(
    domNode: DomNodeInfo,
    now: number,
    durations: Record<LayoutChangeType, number>,
    timings: Record<LayoutChangeType, CubicBezierGetter>,
    type: LayoutChangeType
): {percent: number; finished: boolean} {
    domNode.startTime = domNode.startTime ?? now;
    const cost = now - domNode.startTime;
    const finished = cost >= durations[type];
    const percent = finished ? 1 : timings[type](cost / durations[type]);
    return {percent, finished};
}

/**
 * enter / leave 互补
 */
function getEnterLeaveMoveTick<T>(
    options: IUseChildrenEnterLeaveOptions<T>
): IUseChildrenEnterLeaveOptions<T> {
    const {enterTick: enter, leaveTick: leave, moveTick} = options;
    const enterTick = enter ?? (leave && ((a, b, c, d) => leave(a, 1 - b, c, d)));
    const leaveTick = leave ?? (enter && ((a, b, c, d) => enter(a, 1 - b, c, d)));
    return {enterTick, leaveTick, moveTick};
}

type GetChildPropertyName = 'enterChildProps' | 'leaveChildProps' | 'moveChildProps';

function isNotPropsGetter<T>(
    value: IUseChildrenEnterLeaveOptions<T>[GetChildPropertyName]
): value is Partial<T> | undefined {
    return typeof value !== 'function';
}

function getTimingFunction(
    value: AnimateType | Partial<Record<LayoutChangeType, AnimateType>> = {}
): Record<LayoutChangeType, CubicBezierGetter> {
    const defaultMap = {enter: presets.easeOut, leave: presets.easeIn, move: presets.easeInOut};

    if (typeof value === 'string') {
        return {enter: presets[value], leave: presets[value], move: presets[value]};
    }

    if (Array.isArray(value)) {
        const getter = cubicBezier(...value);
        return {enter: getter, leave: getter, move: getter};
    }

    return (Object.keys(value) as LayoutChangeType[]).reduce((prev, curr) => {
        const item = value[curr] as AnimateType;
        return {...prev, [curr]: (typeof item === 'string' ? presets[item] : cubicBezier(...item))};
    }, defaultMap);
}

function getDuration(
    value: IUseChildrenEnterLeaveOptions['duration'] = 0
): Record<LayoutChangeType, number> {
    return typeof value === 'number' ? {enter: value, leave: value, move: value} : value;
}

// ref https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected
if (!('isConnected' in Node.prototype)) {
    Object.defineProperty(Node.prototype, 'isConnected', {
        get(this: Node) {
            return (!this.ownerDocument
                || !(
                    this.ownerDocument.compareDocumentPosition(this)
                    & this.DOCUMENT_POSITION_DISCONNECTED
                )
            );
        }
    });
}
