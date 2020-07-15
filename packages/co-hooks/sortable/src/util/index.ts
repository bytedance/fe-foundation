/**
 * @file util
 */
import {IMousePos} from '@co-hooks/drag';
import {getElementPosition} from '@co-hooks/dom';

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
    const {clientX, clientY} = pos;

    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
        return false;
    }

    return {
        vertical: top + height / 2 > clientY ? 'top' : 'bottom',
        horizontal: left + width / 2 > clientX ? 'left' : 'right',
        offsetTop: clientY - top,
        offsetLeft: clientX - left,
        offsetBottom: bottom - clientY,
        offsetRight: right - clientX
    };
}

