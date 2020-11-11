/**
 * @file util
 */
import {IMousePos} from '@co-hooks/drag';
import {getElementPosition} from '@co-hooks/dom';

export * from './brick';
export * from './group';
export * from './math';

export interface ICalElemHitWidthMousePosResult {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
    offsetTop: number;
    offsetLeft: number;
    offsetBottom: number;
    offsetRight: number;
}

// 计算鼠标是否在dom元素上
export function calElemHitWithMousePos(elem: HTMLElement, pos: IMousePos): false | ICalElemHitWidthMousePosResult {
    if (elem.nodeType !== 1) {
        return false;
    }

    const {left, top, right, bottom, height, width} = getElementPosition(elem);
    const {pageX, pageY} = pos;

    if (pageX < left || pageX > right || pageY < top || pageY > bottom) {
        return false;
    }

    return {
        vertical: top + height / 2 > pageY ? 'top' : 'bottom',
        horizontal: left + width / 2 > pageX ? 'left' : 'right',
        offsetTop: pageY - top,
        offsetLeft: pageX - left,
        offsetBottom: bottom - pageY,
        offsetRight: right - pageX
    };
}

// 判断两个dom元素是否重叠
export function isElemHit(first: HTMLElement, second: HTMLElement): boolean {
    if (first.nodeType !== 1 || second.nodeType !== 1) {
        return false;
    }

    const firstPos = getElementPosition(first);
    const secondPos = getElementPosition(second);

    return firstPos.right > secondPos.left
        && firstPos.left < secondPos.right
        && firstPos.bottom > secondPos.top
        && firstPos.top < secondPos.bottom;
}
