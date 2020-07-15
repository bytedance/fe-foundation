import {getPrefixedEventKey} from '@co-hooks/dom';

const animationEndEvents = getPrefixedEventKey('AnimationEnd') as 'animationend'[];
const animationStartEvents = getPrefixedEventKey('AnimationStart') as 'animationstart'[];
const transitionEndEvents = getPrefixedEventKey('TransitionEnd') as 'transitionend'[];
const transitionStartEvents = getPrefixedEventKey('TransitionStart') as 'transitionstart'[];

export function addAnimationEndListener(
    element: HTMLElement,
    listener: (event: AnimationEvent) => void
): void {
    animationEndEvents.forEach(event => element.addEventListener(event, listener));
}

export function removeAnimationEndListener(
    element: HTMLElement,
    listener: (event: AnimationEvent) => void
): void {
    animationEndEvents.forEach(event => element.removeEventListener(event, listener));
}

export function addAnimationStartListener(
    element: HTMLElement,
    listener: (event: AnimationEvent) => void
): void {
    animationStartEvents.forEach(event => element.addEventListener(event, listener));
}

export function removeAnimationStartListener(
    element: HTMLElement,
    listener: (event: AnimationEvent) => void
): void {
    animationStartEvents.forEach(event => element.removeEventListener(event, listener));
}

export function addTransitionEndListener(
    element: HTMLElement,
    listener: (event: TransitionEvent) => void
): void {
    transitionEndEvents.forEach(event => element.addEventListener(event, listener));
}

export function removeTransitionEndListener(
    element: HTMLElement,
    listener: (event: TransitionEvent) => void
): void {
    transitionEndEvents.forEach(event => element.removeEventListener(event, listener));
}

export function addTransitionStartListener(
    element: HTMLElement,
    listener: (event: TransitionEvent) => void
): void {
    transitionStartEvents.forEach(event => element.addEventListener(event, listener));
}

export function removeTransitionStartListener(
    element: HTMLElement,
    listener: (event: TransitionEvent) => void
): void {
    transitionStartEvents.forEach(event => element.removeEventListener(event, listener));
}

