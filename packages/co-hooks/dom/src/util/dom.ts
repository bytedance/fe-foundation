/**
 * @file dom DOM操作的一些函数
 */

import {getKeys, isWindow} from '@co-hooks/util';
import {IElementPosition, IElementSize, IOffset, IOverFlowBoundaries} from './type';

/**
 * 是否客户端环境
 *
 */
export function isClient(): boolean {
    return typeof window === 'object';
}

let zIndex = 500;

/**
 * 获取zIndex
 *
 * @return 返回zIndex
 */
export function getZIndex(): number {
    return zIndex += 3;
}

export function getDefaultElementSize(): IElementSize {
    return {
        width: 0,
        height: 0
    };
}

export function getDefaultOffset(): IOffset {
    return {
        x: 0,
        y: 0
    };
}

export function getDefaultElementPosition(): IElementPosition {
    return {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: 0,
        height: 0
    };
}

export function getDefaultOverflowBoundaries(): IOverFlowBoundaries {
    return {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };
}

export function getWindowSize(): IElementSize {

    if (!isClient()) {
        return getDefaultElementSize();
    }

    return {
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    };
}

export type NonReadonlyCss = Partial<Omit<CSSStyleDeclaration, 'length' | 'parentRule'>>;

export function swap<T>(element: HTMLElement, styles: NonReadonlyCss, callback: () => T): T {

    const old: Record<string, unknown> = {};
    const keys = getKeys(styles);

    keys.forEach(key => old[key] = element.style[key]);
    Object.assign(element.style, styles);

    const result = callback();

    Object.assign(element.style, old);

    return result;
}

/**
 * 获取元素大小
 *
 * @param element 要获取的元素
 */
export function getElementSize(element: HTMLElement): IElementSize {

    if (!isClient()) {
        return getDefaultElementSize();
    }

    const {width, height} = getElementPosition(element);

    return {
        width,
        height
    };
}

/**
 * 获取元素位置
 *
 * @param element 要获取的元素
 */
export function getElementPosition(element: HTMLElement): IElementPosition {

    if (!isClient()) {
        return getDefaultElementPosition();
    }

    const style = getComputedStyle(element);

    const getPosition = (): IElementPosition => {

        const {width, height, top, left, right, bottom} = element.getBoundingClientRect();

        return {width, height, top, left, right, bottom};
    };

    if (style.display !== 'none') {
        return getPosition();
    }

    return swap(element, {display: 'block'}, getPosition);
}

export function isElementSizeEqual(a: IElementSize, b: IElementSize): boolean {
    return a.width === b.width && a.height === b.height;
}

export function isElementPositionEqual(a: IElementPosition, b: IElementPosition): boolean {
    return isElementSizeEqual(a, b)
        && a.top === b.top && a.bottom === b.bottom
        && a.left === b.left && a.right === b.right;
}

export function isElementPositionContains(container: IElementPosition, target: IElementPosition): boolean {

    const {left: containerLeft, right: containerRight, top: containerTop, bottom: containerBottom} = container;
    const {left: targetLeft, right: targetRight, top: targetTop, bottom: targetBottom} = target;
    const hc = containerLeft <= targetLeft && containerRight >= targetRight;
    const vc = containerTop <= targetTop && containerBottom >= targetBottom;

    return hc && vc;
}

export function isElementPositionCross(container: IElementPosition, target: IElementPosition): boolean {

    const {left: containerLeft, right: containerRight, top: containerTop, bottom: containerBottom} = container;
    const {left: targetLeft, right: targetRight, top: targetTop, bottom: targetBottom} = target;
    const nhc = containerLeft > targetRight || containerRight < targetLeft;
    const nvc = containerTop > targetBottom || containerBottom < targetTop;

    return !nhc && !nvc;
}

export function isFixed(element: HTMLElement): boolean {
    if (!isClient()) {
        return false;
    }

    if (element === document.body) {
        return false;
    }

    if (getComputedStyle(element).position === 'fixed') {
        return true;
    }

    return element.parentNode ? isFixed(element.parentNode as HTMLElement) : false;
}

export function isSticky(element: HTMLElement): boolean {
    if (!isClient()) {
        return false;
    }

    if (element === document.body) {
        return false;
    }

    if (getComputedStyle(element).position === 'sticky') {
        return true;
    }

    return element.parentNode ? isSticky(element.parentNode as HTMLElement) : false;
}

export interface IElementScroll {
    scrollTop: number;
    scrollLeft: number;
}

export function getDefaultElementScroll(): IElementScroll {
    return {
        scrollLeft: 0,
        scrollTop: 0
    };
}

export function getDocScroll(): IElementScroll {

    if (!isClient()) {
        return getDefaultElementScroll();
    }

    return {
        scrollTop: document.body.scrollTop + document.documentElement.scrollTop,
        scrollLeft: document.body.scrollLeft + document.documentElement.scrollLeft
    };
}

export function getElementScroll(elem: HTMLElement | null): IElementScroll {
    if (!isClient() || !elem) {
        return getDefaultElementScroll();
    }

    const realElem = elem === document.body || elem === document.documentElement ? window : elem;

    if (isWindow(realElem)) {
        return {
            scrollTop: realElem.pageYOffset,
            scrollLeft: realElem.pageXOffset
        };
    }

    return {
        scrollLeft: elem.scrollLeft,
        scrollTop: elem.scrollTop
    };
}

export function closest(ele: HTMLElement, className: string, context: HTMLElement | null = null): HTMLElement | false {
    let elem: HTMLElement | null = ele;
    context = context || document.body;

    while (elem && elem !== context) {
        if (elem.classList.contains(className)) {
            return elem;
        }

        elem = elem.parentElement;
    }

    return false;
}

/**
 * 获取元素内容大小
 *
 * @param element 要获取的元素
 * @param fixHeight 固定高度
 * @param fixWidth 固定宽度
 */
export function getElementContentSize(
    element: HTMLElement,
    fixHeight: boolean = false,
    fixWidth: boolean = false
): IElementSize {

    if (!isClient()) {
        return getDefaultElementSize();
    }

    const needSwap: NonReadonlyCss = {};

    if (!fixHeight) {
        needSwap.height = 'auto';
    }

    if (!fixWidth) {
        needSwap.width = 'auto';
    }

    return swap(element, needSwap, () => ({
        width: Math.ceil(element.offsetWidth),
        height: Math.ceil(element.offsetHeight)
    }));
}

export function addClass(ele: HTMLElement, className: string): void {

    if (!ele) {
        return;
    }

    const tokens = className.split(' ').filter(t => !!t && !ele.classList.contains(t));

    if (tokens.length) {
        ele.classList.add(...tokens);
    }
}

export function removeClass(ele: HTMLElement, className: string): void {

    if (!ele) {
        return;
    }

    const tokens = className.split(' ').filter(t => !!t && ele.classList.contains(t));

    if (tokens.length) {
        ele.classList.remove(...tokens);
    }
}

const styleMap: CSSStyleDeclaration | {} = isClient() ? document.createElement('div').style : {};

export function getPrefixedStyleKey(styleKey: string): string[] {
    if (!styleKey.length) {
        return [];
    }
    const lowerKey = `${styleKey[0].toLowerCase()}${styleKey.slice(1)}`;
    const upperKey = `${styleKey[0].toUpperCase()}${styleKey.slice(1)}`;
    return getPrefixedStyleKey.prefixes
        .map(prefix => (prefix ? `${prefix}${upperKey}` : lowerKey))
        .filter(key => key in styleMap);
}

getPrefixedStyleKey.prefixes = ['', 'webkit', 'moz', 'MS', 'o'];

export function getPrefixedEventKey(eventKey: string): string[] {
    if (!eventKey.length) {
        return [];
    }
    const lowerKey = `${eventKey[0].toLowerCase()}${eventKey.slice(1)}`;
    const upperKey = `${eventKey[0].toUpperCase()}${eventKey.slice(1)}`;
    return getPrefixedEventKey.prefixes.reduce<string[]>((prev, prefix) => {
        const prefixedLowerKey = `${prefix}${eventKey}`.toLowerCase();
        const camelCaseKey = (prefix ? `${prefix}${upperKey}` : lowerKey);
        if (isClient() && `on${prefixedLowerKey}` in window) {
            return prev.concat(prefixedLowerKey, camelCaseKey);
        }
        return prev;
    }, []);
}

getPrefixedEventKey.prefixes = ['', 'webkit', 'moz', 'MS', 'o'];

export function getScrollbarWidth(): number {
    if (!isClient()) {
        return 0;
    }

    const innerHeight = window.innerHeight || document.documentElement.clientHeight;
    if (document.body.scrollHeight > innerHeight) {
        return 0;
    }
    const element = document.createElement('div');
    element.style.cssText = `
        overflow: scroll;
        position: absolute;
        top: -99px;
        left: -99px;
        width: 99px;
        height: 99px;
        opacity: 0;
    `;
    document.body.appendChild(element);
    const scrollbarWidth = element.offsetWidth - element.clientWidth;
    document.body.removeChild(element);
    return scrollbarWidth;
}
