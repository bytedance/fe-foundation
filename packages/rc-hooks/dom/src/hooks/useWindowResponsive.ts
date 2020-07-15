/**
 * @file useElementResponsive
 */

import {useRefCallback, useRefGetter} from '@rc-hooks/use';
import {useRef} from 'react';
import {IElementSize, getDefaultElementSize} from '@co-hooks/dom';
import {useWindowSize} from './useWindowSize';
import {IResponsiveBreakpoint, ResponsiveHandler, matchBreakpoints} from './useElementResponsive';

export function useWindowResponsive(
    enable: () => boolean,
    breakpoints: IResponsiveBreakpoint[],
    onBreakpointChange?: ResponsiveHandler,
    range: boolean = false
): void {

    const lastElementSize = useRef<IElementSize | undefined>(range ? getDefaultElementSize() : undefined);
    const breakpointsRefGetter = useRefGetter(breakpoints);
    const onBreakpointChangeCallback = useRefCallback(onBreakpointChange);

    useWindowSize(enable, (size: IElementSize) => {

        const bkList = breakpointsRefGetter();

        if (bkList.length === 0) {
            return;
        }

        const lastSize = lastElementSize.current || size;

        // 第一次如果不存在的话，同步一下，这样会阻止第一次的触发，适合单点模式
        if (!lastElementSize.current) {
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
