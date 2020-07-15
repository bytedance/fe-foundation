/**
 * @file Animation 动画类
 */
import {Emitter} from '@co-hooks/emitter';
import {addClass, getPrefixedStyleKey, removeClass} from '@co-hooks/dom';
import {
    AnimateEvents,
    IAnimationValue,
    ITransitionValue,
    getAnimationValues,
    getTransitionValues
} from '../util';

export const animationPlayStateKeys = getPrefixedStyleKey('animationPlayState');

interface AnimationMeta {
    animating: boolean;
    reseted: boolean;
    timeoutId: number | null;
}

export interface IAnimationEvent<T> {
    'animate-ready': [T];
    'animate-start': [T];
    'animate-end': [T, boolean];
}

type AnimationCSSType = 'animation' | 'transition';
type ValidKeyFrames = boolean | string | ((keyframe: string, event: AnimationEvent) => boolean);
type ValidProperty = boolean | string | ((property: string, event: TransitionEvent) => boolean);

export interface IAnimationBaseOptions {
    activeClassName?: string;
    presetClassName?: string;
    timeout?: number | boolean;
    /**
     * @default
     * 'animation'
     */
    type?: AnimationCSSType;
    /**
     * @default
     * 'false'
     * @description
     * - `false`: the keyframe with longest duration
     * - `true`: the keyframe with shortest duration
     * - `string`: specific keyframe
     */
    validKeyframes?: ValidKeyFrames;
    /**
     * @default
     * 'false'
     * @description
     * - `false`: the property with longest duration
     * - `true`: the property with shortest duration
     * - `string`: specific property
     */
    validProperty?: ValidProperty;
    validTarget?: EventTarget | null;
}

export class Animation<T = undefined> extends Emitter<IAnimationEvent<T>> {

    private activeClassName?: string;

    private presetClassName?: string;

    private validKeyframes?: ValidKeyFrames;

    private validProperty?: ValidProperty;

    private validTarget?: EventTarget | null;

    private type: AnimationCSSType = 'animation';

    private ele: HTMLElement | null = null;

    private timeout: number | boolean = true;

    private maxTimeCost: number = Infinity;

    public updateOptions(options: IAnimationBaseOptions): void {
        this.activeClassName = options.activeClassName;
        this.presetClassName = options.presetClassName;
        this.validKeyframes = options.validKeyframes;
        this.validProperty = options.validProperty;
        this.validTarget = options.validTarget;
        this.timeout = options.timeout ?? true;
        this.type = options.type ?? 'animation';
    }

    public setEle(ele: HTMLElement | null): void {
        this.ele = ele;
    }

    public start(identifier?: T): () => void {
        if (!this.ele) {
            return () => void 0;
        }

        const removeEffect = this.type === 'animation'
            ? this.startAnimation(this.ele, identifier as T)
            : this.startTransition(this.ele, identifier as T);

        return removeEffect;
    }

    private setAnimationPlayState(paused: boolean): void {
        if (!this.ele) {
            return;
        }

        if (paused) {
            for (const styleKey of animationPlayStateKeys) {
                this.ele.style[styleKey as unknown as number] = 'paused';
            }
        } else {
            for (const styleKey of animationPlayStateKeys) {
                this.ele.style[styleKey as unknown as number] = '';
            }
        }
    }

    private startAnimation(ele: HTMLElement, identifier: T): () => void {
        // 绑定事件后引用原始的变量，不受 updateOptions 等影响
        const validTarget = this.validTarget;
        const validKeyframes = this.validKeyframes;
        const activeClassName = this.activeClassName || '';
        const presetClassName = this.presetClassName || '';
        const meta: AnimationMeta = {animating: true, reseted: false, timeoutId: null};
        const timeSource = validTarget && validTarget instanceof HTMLElement ? validTarget : ele;

        this.setAnimationPlayState(true);
        addClass(ele, `${presetClassName} ${activeClassName}`);
        const animationRange = this.getTimeRange(getAnimationValues(timeSource));

        const handler = (event: AnimationEvent): void => {
            if (validTarget !== undefined && validTarget !== event.target) {
                return;
            }
            if (!meta.animating || meta.reseted) {
                return;
            }
            // 过滤非指定的 keyframe animation 事件
            if (isValidKeyframe(validKeyframes, animationRange, event)) {
                AnimateEvents.removeAnimationEndListener(ele, handler);
                removeClass(ele, `${presetClassName} ${activeClassName}`);
                meta.timeoutId && clearTimeout(meta.timeoutId);
                Object.assign(meta, {animating: false, reseted: true, timeoutId: null});
                this.emit('animate-end', identifier, false);
            }
        };

        AnimateEvents.addAnimationEndListener(ele, handler);
        this.emit('animate-ready', identifier);
        this.setAnimationPlayState(false);
        this.emit('animate-start', identifier);

        const reset = (): void => {
            if (!meta.reseted) {
                AnimateEvents.removeAnimationEndListener(ele, handler);
                removeClass(ele, `${presetClassName} ${activeClassName}`);
                meta.timeoutId && clearTimeout(meta.timeoutId);
                Object.assign(meta, {reseted: true, timeoutId: null});
                this.emit('animate-end', identifier, meta.animating);
            }
        };

        // Number.isFinite(maxCosts)
        if (this.timeout !== false) {
            const timeout = this.timeout !== true ? this.timeout : this.maxTimeCost * 1000 + 300;
            meta.timeoutId = window.setTimeout(reset, timeout);
        }

        return reset;
    }

    private startTransition(ele: HTMLElement, identifier: T): () => void {
        // 绑定事件后引用原始的变量，不受 updateOptions 等影响
        const validTarget = this.validTarget;
        const validProperty = this.validProperty;
        const activeClassName = this.activeClassName || '';
        const presetClassName = this.presetClassName || '';
        const meta: AnimationMeta = {animating: true, reseted: false, timeoutId: null};
        const timeSource = validTarget && validTarget instanceof HTMLElement ? validTarget : ele;

        addClass(ele, presetClassName);
        const transitionRange = this.getTimeRange(getTransitionValues(timeSource));

        const handler = (event: TransitionEvent): void => {
            if (validTarget !== undefined && validTarget !== event.target) {
                return;
            }
            if (!meta.animating || meta.reseted) {
                return;
            }
            // 过滤非指定的 property transition 事件
            if (isValidProperty(validProperty, transitionRange, event)) {
                AnimateEvents.removeTransitionEndListener(ele, handler);
                removeClass(ele, `${presetClassName} ${activeClassName}`);
                meta.timeoutId && clearTimeout(meta.timeoutId);
                Object.assign(meta, {animating: false, reseted: true, timeoutId: null});
                this.emit('animate-end', identifier, false);
            }
        };

        AnimateEvents.addTransitionEndListener(ele, handler);
        this.emit('animate-ready', identifier);
        addClass(ele, activeClassName);
        this.emit('animate-start', identifier);

        const reset = (): void => {
            if (!meta.reseted) {
                AnimateEvents.removeTransitionEndListener(ele, handler);
                removeClass(ele, `${presetClassName} ${activeClassName}`);
                meta.timeoutId && clearTimeout(meta.timeoutId);
                Object.assign(meta, {reseted: true, timeoutId: null});
                this.emit('animate-end', identifier, meta.animating);
            }
        };

        // Number.isFinite(maxCosts)
        if (this.timeout !== false) {
            const timeout = this.timeout !== true ? this.timeout : this.maxTimeCost * 1000 + 300;
            meta.timeoutId = window.setTimeout(reset, timeout);
        }

        return reset;
    }

    private getTimeRange<T extends IAnimationValue | ITransitionValue>(
        values: T[]
    ): [T, T] | undefined {
        this.maxTimeCost = Infinity;
        return values.reduce((prev, curr) => {
            const currTimeCost = this.getTimeCost(curr);
            if (!prev) {
                this.maxTimeCost = currTimeCost;
                return [curr, curr];
            }
            if (this.getTimeCost(prev[0]) > currTimeCost) {
                prev[0] = curr;
            } else if (this.getTimeCost(prev[1]) < currTimeCost) {
                prev[1] = curr;
                this.maxTimeCost = currTimeCost;
            }
        }, undefined as [T, T] | undefined);
    }

    private getTimeCost(value: IAnimationValue | ITransitionValue): number {
        const times = 'iterationCount' in value ? value.iterationCount : 1;
        return value.delay + value.duration * times;
    }
}

function isValidKeyframe(
    option: ValidKeyFrames = false,
    valueRange: [IAnimationValue, IAnimationValue] | undefined,
    event: AnimationEvent
): boolean {
    switch (typeof option) {
        case 'function':
            return option(event.animationName, event);
        case 'string':
            return event.animationName === option;
    }
    if (!valueRange) {
        return false;
    }
    return option
        ? event.animationName === valueRange[0].keyframes
        : event.animationName === valueRange[1].keyframes;
}

function isValidProperty(
    option: ValidProperty = false,
    valueRange: [ITransitionValue, ITransitionValue] | undefined,
    event: TransitionEvent
): boolean {
    switch (typeof option) {
        case 'function':
            return option(event.propertyName, event);
        case 'string':
            return event.propertyName === option;
    }
    if (!valueRange) {
        return false;
    }
    return option
        ? event.propertyName === valueRange[0].property
        : event.propertyName === valueRange[1].property;
}

