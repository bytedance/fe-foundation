/**
 * @file useElementResponsive 元素相应式函数
 */
import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {RefObject, useRef} from 'react';
import {IElementSize, getDefaultElementSize} from '@co-hooks/dom';
import {useElementSize} from './useElementSize';

export interface IResponsiveBreakpoint {
    name: string;
    point: number;
}

export interface IResponsiveBreakpointInfo extends IResponsiveBreakpoint {
    reverse: boolean;
    width: number;
    lastWidth: number;
}

export type ResponsiveHandler = (info: IResponsiveBreakpointInfo) => void;

export function useElementResponsive(
    element: HTMLElement | null | RefObject<HTMLElement>,
    enable: () => boolean,
    breakpoints: IResponsiveBreakpoint[],
    onBreakpointChange?: ResponsiveHandler,
    range: boolean = false
): void {

    const lastElementSize = useRef<IElementSize | undefined>(range ? getDefaultElementSize() : undefined);
    const breakpointsRefGetter = useRefGetter(breakpoints);
    const onBreakpointChangeCallback = useRefCallback(onBreakpointChange);

    useElementSize(element, enable, (size: IElementSize) => {

        const bkList = breakpointsRefGetter();

        if (bkList.length === 0) {
            return;
        }

        const lastSize = lastElementSize.current || size;

        if (!lastElementSize.current) { // 第一次
            lastElementSize.current = size;
            return;
        }

        const matched = matchBreakpoints(bkList, size.width, lastSize.width);

        if (matched != null) {
            onBreakpointChangeCallback(matched);
        }

        lastElementSize.current = size;
    });
}

export function matchBreakpointRange(
    bkList: IResponsiveBreakpoint[],
    width: number
): IResponsiveBreakpoint {

    // 默认第一个
    let res: IResponsiveBreakpoint = bkList[0];

    // 从小到大排序
    bkList.sort((a, b) => a.point - b.point);

    bkList.some((bk, i) => {

        // 排序之后，找到第一个离当前最近的，或者最后一个
        const matched = width >= bk.point && (i + 1 === bkList.length || width < bkList[i + 1].point);

        if (matched) {
            res = bk;
        }

        return matched;
    });

    return res;
}


export function matchBreakpoints(
    bkList: IResponsiveBreakpoint[],
    width: number,
    lastWidth: number
): IResponsiveBreakpointInfo | null {

    const currentMatched = matchBreakpointRange(bkList, width);
    const lastMatched = matchBreakpointRange(bkList, lastWidth);

    if (currentMatched.name === lastMatched.name) {
        return null;
    }

    return {
        ...currentMatched,
        width,
        lastWidth,
        reverse: lastWidth > width
    };
}
